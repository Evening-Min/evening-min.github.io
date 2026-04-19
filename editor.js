/**
 * editor.js
 * 기능: 시승기 본문 별도 JSON 저장, 이미지 다중 업로드, data.json 경로 업데이트
 */

let selectedFiles = []; 
let currentAllData = []; 
let targetCarIndex = null; 

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    targetCarIndex = urlParams.get('id');

    initEditor();

    const btnAddImage = document.getElementById('btn-add-image');
    const fileInput = document.getElementById('file-input');
    const btnSave = document.getElementById('btn-save-post');

    btnAddImage.onclick = () => fileInput.click();
    
    fileInput.onchange = (e) => {
        selectedFiles = Array.from(e.target.files);
        document.getElementById('file-count').innerText = `${selectedFiles.length}개의 파일이 선택되었습니다.`;
    };

    btnSave.onclick = handlePublish;
});

/**
 * 에디터 초기화: <h3>에 차량 정보 표시 및 기존 데이터 로드
 */
async function initEditor() {
    try {
        const res = await fetch('data.json?t=' + new Date().getTime());
        currentAllData = await res.json();
        
        if (targetCarIndex === null || !currentAllData[targetCarIndex]) {
            alert("잘못된 접근입니다. 관리자 페이지로 돌아갑니다.");
            location.href = 'admin.html';
            return;
        }

        const car = currentAllData[targetCarIndex];
        
        // 상단 h3에 현재 작업 차량 표시
        document.getElementById('target-car-info').innerText = `작성 중인 차량: ${car.year} ${car.brand} ${car.name}`;

        // 수정 모드: 기존 시승기 파일(reviewPath)이 있다면 해당 내용을 fetch해서 채움
        if (car.isPublished && car.reviewPath) {
            const reviewRes = await fetch(car.reviewPath + '?t=' + new Date().getTime());
            const reviewDetail = await reviewRes.json();
            
            document.getElementById('post-title').value = reviewDetail.title || "";
            document.getElementById('post-content').value = reviewDetail.content || "";
            document.getElementById('file-count').innerText = `기존 폴더: ${reviewDetail.imageFolder}`;
            document.getElementById('btn-save-post').innerText = "시승기 수정 완료";
        }
    } catch (e) {
        console.error("데이터 로드 실패:", e);
    }
}

/**
 * 발행 프로세스: 이미지 업로드 -> 시승기 JSON 업로드 -> data.json 업데이트
 */
async function handlePublish() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const GITHUB_TOKEN = localStorage.getItem("gh_token");

    if (!title || !content) {
        alert("제목과 본문을 입력해주세요.");
        return;
    }

    const btnSave = document.getElementById('btn-save-post');
    btnSave.disabled = true;
    btnSave.innerText = "데이터 분리 저장 중...";

    try {
        const car = currentAllData[targetCarIndex];
        const timestamp = new Date().getTime();
        const carSafeName = car.name.replace(/\s+/g, '_');

        // 1. 이미지 업로드 (폴더 생성)
        let folderName = car.imageFolder || ""; 
        if (selectedFiles.length > 0) {
            folderName = await uploadImagesToGitHub(carSafeName, timestamp);
        }

        // 2. 시승기 본문 별도 JSON 파일로 저장 (reviews/ 폴더)
        const reviewPath = await uploadReviewJson(carSafeName, timestamp, title, content, folderName);

        // 3. 메인 data.json 업데이트 (경로만 저장)
        currentAllData[targetCarIndex].postTitle = title;
        currentAllData[targetCarIndex].reviewPath = reviewPath; // 본문 대신 파일 경로 저장
        currentAllData[targetCarIndex].imageFolder = folderName;
        currentAllData[targetCarIndex].isPublished = true;

        await updateMainDataJson(currentAllData, title);

        alert("시승기가 별도 파일로 안전하게 저장되었습니다!");
        location.href = 'admin.html';

    } catch (e) {
        alert("저장 실패: " + e.message);
    } finally {
        btnSave.disabled = false;
        btnSave.innerText = "시승기 발행하기";
    }
}

/**
 * [추가] 시승기 본문을 별도 JSON으로 업로드
 */
async function uploadReviewJson(carName, timestamp, title, content, folderName) {
    const GITHUB_TOKEN = localStorage.getItem("gh_token");
    const fileName = `${timestamp}_${carName}.json`;
    const path = `reviews/${fileName}`;
    
    const reviewData = {
        title: title,
        content: content,
        imageFolder: folderName,
        createdAt: new Date().toLocaleString()
    };

    const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(reviewData, null, 2))));
    
    await fetch(`https://api.github.com/repos/evening-min/evening-min.github.io/contents/${path}`, {
        method: "PUT",
        headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            message: `Review JSON: ${title}`,
            content: contentBase64
        })
    });

    return path; // 나중에 불러올 때 사용할 경로 반환
}

/**
 * 이미지를 GitHub에 업로드
 */
async function uploadImagesToGitHub(carName, timestamp) {
    const GITHUB_TOKEN = localStorage.getItem("gh_token");
    const folderName = `${timestamp}_${carName}`;
    
    for (const file of selectedFiles) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });

        const path = `images/${folderName}/${file.name}`;
        await fetch(`https://api.github.com/repos/evening-min/evening-min.github.io/contents/${path}`, {
            method: "PUT",
            headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: `Img: ${file.name}`, content: base64 })
        });
    }
    return folderName;
}

/**
 * 메인 data.json 업데이트
 */
async function updateMainDataJson(updatedList, title) {
    const GITHUB_TOKEN = localStorage.getItem("gh_token");
    const url = `https://api.github.com/repos/evening-min/evening-min.github.io/contents/data.json`;

    const getRes = await fetch(url, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });
    const fileData = await getRes.json();

    const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(updatedList, null, 2))));

    await fetch(url, {
        method: "PUT",
        headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            message: `Update Link: ${title}`,
            content: updatedContent,
            sha: fileData.sha
        })
    });
}