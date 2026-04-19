/**
 * editor.js
 * 기능: 시승기 불러오기(수정 모드), 이미지 다중 업로드(폴더 생성), data.json 통합 저장
 */

let selectedFiles = []; // 사용자가 선택한 파일 배열
let currentAllData = []; // 전체 자동차 데이터
let targetCarIndex = null; // 현재 편집 중인 차량의 인덱스

document.addEventListener('DOMContentLoaded', () => {
    // 1. URL에서 차량 ID 추출 (예: editor.html?id=3)
    const urlParams = new URLSearchParams(window.location.search);
    targetCarIndex = urlParams.get('id');

    // 2. 초기 데이터 로드 및 UI 셋팅
    initEditor();

    // 3. 버튼 이벤트 연결
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
 * 에디터 초기화: 데이터 로드 및 기존 내용 채우기
 */
async function initEditor() {
    try {
        const res = await fetch('data.json?t=' + new Date().getTime());
        currentAllData = await res.json();
        
        if (targetCarIndex === null || !currentAllData[targetCarIndex]) {
            alert("잘못된 접근입니다.");
            location.href = 'admin.html';
            return;
        }

        const car = currentAllData[targetCarIndex];
        
        // 🚗 h3 태그에 차량 정보 노출
        const infoTag = document.getElementById('target-car-info');
        infoTag.innerText = `작성 중인 차량: ${car.year} ${car.brand} ${car.name}`;

        // 수정 모드일 경우 기존 데이터 채우기
        if (car.isPublished) {
            document.getElementById('post-title').value = car.postTitle || "";
            document.getElementById('post-content').value = car.postContent || "";
            document.getElementById('file-count').innerText = `기존 이미지 폴더: ${car.imageFolder}`;
            document.getElementById('btn-save-post').innerText = "시승기 수정 완료";
        }
    } catch (e) {
        console.error("데이터 로드 실패:", e);
    }
}

/**
 * 발행/수정 메인 프로세스
 */
async function handlePublish() {
    const selectedIdx = document.getElementById('car-selector').value;
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const GITHUB_TOKEN = localStorage.getItem("gh_token");

    if (!selectedIdx || !title || !content) {
        alert("대상 차량, 제목, 본문을 모두 입력해주세요.");
        return;
    }

    const btnSave = document.getElementById('btn-save-post');
    btnSave.disabled = true;
    btnSave.innerText = "처리 중...";

    try {
        // 1. 새 이미지가 있다면 업로드 진행 (폴더 생성)
        let folderName = currentAllData[selectedIdx].imageFolder || "";
        if (selectedFiles.length > 0) {
            folderName = await uploadImagesToGitHub(currentAllData[selectedIdx].name);
        }

        // 2. 데이터 객체 업데이트
        currentAllData[selectedIdx].postTitle = title;
        currentAllData[selectedIdx].postContent = content;
        currentAllData[selectedIdx].imageFolder = folderName;
        currentAllData[selectedIdx].isPublished = true;
        currentAllData[selectedIdx].lastUpdated = new Date().toLocaleString();

        // 3. GitHub에 data.json 저장
        await updateDataJson(currentAllData, title);

        alert("시승기가 성공적으로 저장되었습니다.");
        location.href = 'admin.html';

    } catch (e) {
        alert("오류 발생: " + e.message);
    } finally {
        btnSave.disabled = false;
        btnSave.innerText = "시승기 발행하기";
    }
}

/**
 * 이미지를 GitHub 타임스탬프 폴더에 업로드
 */
async function uploadImagesToGitHub(carName) {
    const GITHUB_TOKEN = localStorage.getItem("gh_token");
    const timestamp = new Date().getTime();
    const folderName = `${timestamp}_${carName.replace(/\s+/g, '_')}`;
    
    for (const file of selectedFiles) {
        const reader = new FileReader();
        const base64Content = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });

        const path = `images/${folderName}/${file.name}`;
        const url = `https://api.github.com/repos/evening-min/evening-min.github.io/contents/${path}`;

        await fetch(url, {
            method: "PUT",
            headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Upload: ${file.name}`,
                content: base64Content
            })
        });
    }
    return folderName;
}

/**
 * 최종 data.json 업데이트
 */
async function updateDataJson(updatedList, postTitle) {
    const GITHUB_TOKEN = localStorage.getItem("gh_token");
    const url = `https://api.github.com/repos/evening-min/evening-min.github.io/contents/data.json`;

    // 최신 SHA 값을 가져오기 위해 먼저 fetch
    const getRes = await fetch(url, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });
    const fileData = await getRes.json();

    const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(updatedList, null, 2))));

    await fetch(url, {
        method: "PUT",
        headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            message: `Update Review: ${postTitle}`,
            content: updatedContent,
            sha: fileData.sha
        })
    });
}