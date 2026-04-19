/**
 * editor.js
 * 기능: 시승기 작성, 이미지 다중 업로드(타임스탬프 폴더), data.json 업데이트
 */

let selectedFiles = [];

document.addEventListener('DOMContentLoaded', () => {
    loadCarList(); // DB에서 차량 목록 불러오기

    // 요소 연결
    const btnAddImage = document.getElementById('btn-add-image');
    const fileInput = document.getElementById('file-input');
    const btnSave = document.getElementById('btn-save-post');

    // 1. 이미지 추가 버튼 클릭 시 숨겨진 input 호출
    btnAddImage.onclick = () => fileInput.click();

    // 2. 파일 선택 시 상태 업데이트
    fileInput.onchange = (e) => {
        selectedFiles = Array.from(e.target.files);
        document.getElementById('file-count').innerText = `${selectedFiles.length}개의 파일이 선택되었습니다.`;
    };

    // 3. 발행하기 버튼 클릭
    btnSave.onclick = handlePublish;
});

// [기능] 기존 data.json에서 차량 목록을 불러와 셀렉트 박스에 채움
async function loadCarList() {
    try {
        const res = await fetch('data.json?t=' + new Date().getTime());
        const data = await res.json();
        const selector = document.getElementById('car-selector');

        data.forEach((car, index) => {
            const opt = document.createElement('option');
            opt.value = index; // 배열 인덱스를 value로 사용
            opt.innerText = `[${car.brand}] ${car.name} (${car.year})`;
            selector.appendChild(opt);
        });
    } catch (e) {
        console.error("차량 목록 로드 실패:", e);
    }
}

// [핵심] 발행 프로세스: 이미지 업로드 -> 데이터 업데이트
async function handlePublish() {
    const carIndex = document.getElementById('car-selector').value;
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const GITHUB_TOKEN = localStorage.getItem("gh_token");

    if (!carIndex || !title || !content) {
        alert("대상 차량, 제목, 본문을 모두 입력해주세요.");
        return;
    }

    if (!GITHUB_TOKEN) {
        alert("GitHub 토큰이 없습니다. 다시 로그인해주세요.");
        return;
    }

    const btnSave = document.getElementById('btn-save-post');
    btnSave.disabled = true;
    btnSave.innerText = "업로드 중... 잠시만 기다려주세요.";

    try {
        // 1. 선택된 차량 데이터 가져오기
        const res = await fetch('data.json?t=' + new Date().getTime());
        const allData = await res.json();
        const targetCar = allData[carIndex];

        // 2. 이미지 업로드 (폴더 생성)
        let folderName = "";
        if (selectedFiles.length > 0) {
            folderName = await uploadImagesToGitHub(targetCar.name);
        }

        // 3. 차량 객체에 시승기 내용 추가 (스키마 확장)
        allData[carIndex].postTitle = title;
        allData[carIndex].postContent = content;
        allData[carIndex].imageFolder = folderName; // 이미지들이 담긴 폴더명 저장
        allData[carIndex].isPublished = true;       // 발행 여부 플래그

        // 4. 최종 data.json 깃허브에 업데이트
        await updateDataJson(allData, title);

        alert("시승기가 성공적으로 발행되었습니다!");
        location.href = 'admin.html'; // 완료 후 관리자 페이지로 이동

    } catch (e) {
        console.error(e);
        alert("발행 실패: " + e.message);
    } finally {
        btnSave.disabled = false;
        btnSave.innerText = "시승기 발행하기";
    }
}

// [기능] 파일을 Base64로 변환
const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// [기능] 이미지 다중 업로드 로직
async function uploadImagesToGitHub(carName) {
    const GITHUB_TOKEN = localStorage.getItem("gh_token");
    const REPO_OWNER = "evening-min";
    const REPO_NAME = "evening-min.github.io";
    
    const timestamp = new Date().getTime();
    const folderName = `${timestamp}_${carName.replace(/\s+/g, '_')}`;
    
    for (const file of selectedFiles) {
        const base64Content = await readFileAsBase64(file);
        const path = `images/${folderName}/${file.name}`;
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

        await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Upload image: ${file.name} for review`,
                content: base64Content
            })
        });
    }
    return folderName;
}

// [기능] data.json 파일 업데이트 (admin.js 로직 응용)
async function updateDataJson(updatedList, title) {
    const GITHUB_TOKEN = localStorage.getItem("gh_token");
    const REPO_OWNER = "evening-min";
    const REPO_NAME = "evening-min.github.io";
    const FILE_PATH = "data.json";

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const res = await fetch(url, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });
    const fileData = await res.json();

    const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(updatedList, null, 2))));

    await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: `Publish Review: ${title}`,
            content: updatedContent,
            sha: fileData.sha
        })
    });
}