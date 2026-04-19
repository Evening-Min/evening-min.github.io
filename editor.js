/**
 * editor.js
 * 기능: 시승기 본문 별도 JSON 저장, 이미지 다중 업로드, 메인 DB 경로 업데이트
 */

let selectedFiles = []; 
let currentAllData = []; 
let targetCarIndex = null; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. URL에서 대상 차량 ID(index) 파라미터 추출
    const urlParams = new URLSearchParams(window.location.search);
    targetCarIndex = urlParams.get('id');

    // 2. 초기 데이터 로드 및 UI 설정
    initEditor();

    // 3. 이벤트 리스너 등록
    const btnAddImage = document.getElementById('btn-add-image');
    const fileInput = document.getElementById('file-input');
    const btnSave = document.getElementById('btn-save-post');

    if (btnAddImage && fileInput) {
        btnAddImage.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            selectedFiles = Array.from(e.target.files);
            document.getElementById('file-count').innerText = `${selectedFiles.length}개의 이미지가 선택됨`;
        };
    }

    if (btnSave) {
        btnSave.onclick = handlePublish;
    }
});

/**
 * 에디터 초기화: 차량 정보 표시 및 기존 데이터 로드
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
        
        // 상단 배지에 현재 작업 차량 표시
        const infoTag = document.getElementById('target-car-info');
        if (infoTag) {
            infoTag.innerText = `작성 중: ${car.year} ${car.brand} ${car.name}`;
        }

        // 수정 모드: 기존 시승기(reviewPath)가 있다면 내용을 불러와 채움
        if (car.isPublished && car.reviewPath) {
            await loadExistingReview(car.reviewPath);
        }
    } catch (e) {
        console.error("데이터 로드 실패:", e);
    }
}

/**
 * 기존 시승기 JSON 데이터를 가져와 화면에 채우는 함수
 */
async function loadExistingReview(reviewPath) {
    try {
        const res = await fetch(reviewPath + '?t=' + new Date().getTime());
        const reviewDetail = await res.json();
        
        document.getElementById('post-title').value = reviewDetail.title || "";
        document.getElementById('post-content').value = reviewDetail.content || "";
        document.getElementById('file-count').innerText = `기존 폴더: ${reviewDetail.imageFolder || '없음'}`;
        document.getElementById('btn-save-post').innerText = "시승기 수정 완료";
    } catch (e) {
        console.error("기존 시승기 로드 실패:", e);
    }
}

/**
 * [핵심] 발행 프로세스: 이미지 -> 본문 JSON -> 메인 DB 순차적 업로드
 */
async function handlePublish() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;

    if (!title || !content) {
        alert("제목과 본문을 입력해주세요.");
        return;
    }

    const btnSave = document.getElementById('btn-save-post');
    btnSave.disabled = true;
    btnSave.innerText = "발행 중 (잠시만 기다려주세요...)";

    // handlePublish 함수 중간 부분
    try {
        const car = currentAllData[targetCarIndex];
        const timestamp = new Date().getTime();
        const carSafeName = car.name.replace(/\s+/g, '_');

        // 1. 이미지 업로드 시 folderName과 개수를 함께 받아옴
        let folderInfo = { folderName: car.imageFolder || "", imageCount: car.imageCount || 0 };
        if (selectedFiles.length > 0) {
            folderInfo = await uploadImagesToGitHub(carSafeName, timestamp);
        }

        // 2. 시승기 본문 JSON에 이미지 정보 기록
        const reviewData = {
            title: title,
            content: content,
            // [중요] 차량 상세 정보를 포스트 데이터에 직접 포함
            carDetails: {
                brand: car.brand,
                year: car.year,
                name: car.name,
                fuel: car.fuel || "정보 없음",
                price: car.price || "정보 없음"
            },
            imageFolder: folderInfo.folderName,
            imageCount: folderInfo.imageCount,
            updatedAt: new Date().toISOString()
        };
        const reviewPath = `reviews/${timestamp}_${carSafeName}.json`;
        await uploadToGithub(reviewPath, reviewData, `Review: ${title}`);

        // 3. 메인 data.json 업데이트 (경로만 저장)
        currentAllData[targetCarIndex].postTitle = title;
        currentAllData[targetCarIndex].reviewPath = reviewPath;
        currentAllData[targetCarIndex].imageFolder = folderName;
        currentAllData[targetCarIndex].isPublished = true;

        await updateMainDataJson(currentAllData, title);

        alert("시승기가 성공적으로 발행되었습니다!");
        location.href = 'admin.html';

    } catch (e) {
        console.error(e);
        alert("발행 실패: " + e.message);
    } finally {
        btnSave.disabled = false;
        btnSave.innerText = "시승기 발행하기";
    }
}

/**
 * 다중 이미지 업로드 함수
 */
/**
 * 다중 이미지 업로드 함수 (자동 번호 매기기 버전)
 */
async function uploadImagesToGitHub(carName, timestamp) {
    const folderName = `${timestamp}_${carName}`;
    let fileIndex = 1; // 1번부터 시작하는 카운터

    for (const file of selectedFiles) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });

        // 원본 확장자를 유지하고 싶다면 file.name에서 추출, 
        // 일관성을 위해 소문자 .jpg로 통일하고 싶다면 'jpg'로 고정할 수 있습니다.
        const extension = file.name.split('.').pop().toLowerCase(); 
        const fileName = `${fileIndex}.${extension}`; 
        const path = `images/${folderName}/${fileName}`;

        await uploadToGithub(path, base64, `Upload Img: ${fileName}`, true);
        
        fileIndex++; // 다음 파일은 2, 3, 4... 순으로 증가
    }
    
    // 나중에 post.js에서 슬라이더를 만들 때 몇 장인지 알 수 있도록 
    // 총 이미지 개수를 리턴하거나 어딘가에 저장하면 좋습니다.
    return { folderName, imageCount: fileIndex - 1 };
}

/**
 * GitHub API를 이용한 공용 업로드 함수
 */
async function uploadToGithub(path, data, message, isBase64 = false) {
    const GITHUB_TOKEN = localStorage.getItem("gh_token");
    const REPO_OWNER = "evening-min";
    const REPO_NAME = "evening-min.github.io";
    
    let content;
    if (isBase64) {
        content = data;
    } else {
        content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    }

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    
    // 파일 존재 여부 확인 (수정 시 SHA 필요)
    let sha;
    try {
        const getRes = await fetch(url, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });
        if (getRes.ok) {
            const fileData = await getRes.json();
            sha = fileData.sha;
        }
    } catch (e) {}

    const body = { message, content };
    if (sha) body.sha = sha;

    const putRes = await fetch(url, {
        method: "PUT",
        headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!putRes.ok) throw new Error(`${path} 업로드 실패`);
}

/**
 * 메인 data.json 업데이트 전용 함수
 */
async function updateMainDataJson(updatedList, title) {
    await uploadToGithub("data.json", updatedList, `Update Link: ${title}`);
}