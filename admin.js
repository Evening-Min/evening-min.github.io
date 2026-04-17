// 변수를 함수 밖 상단에 선언하여 어디서든 접근 가능하게 합니다.
let modal, btnOpen, btnCancel, btnNext, carForm;

document.addEventListener('DOMContentLoaded', () => {
    // 요소 할당
    modal = document.getElementById('modal-container');
    btnOpen = document.getElementById('btn-open-modal');
    btnCancel = document.getElementById('btn-cancel');
    btnNext = document.getElementById('btn-next'); // HTML에서 '데이터 생성' 버튼
    carForm = document.getElementById('car-form');

    // 1. 모달 열기 버튼
    if (btnOpen) {
        btnOpen.onclick = () => {
            modal.style.display = 'block';
        };
    }

    // 2. 취소 버튼
    if (btnCancel) {
        btnCancel.onclick = () => {
            if (confirm("입력된 내용은 저장되지 않습니다. 취소하시겠습니까?")) {
                carForm.reset();
                modal.style.display = 'none';
            }
        };
    }

    // 3. 데이터 생성 버튼 (기존 구글 폼 전송 삭제)
    if (btnNext) {
        btnNext.onclick = generateJSONData;
    }

    // 초기 데이터 로드 (로컬 data.json 호출)
    loadLocalData();
});

// 가격 쉼표 포맷 함수
function formatPrice(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value) {
        input.value = parseInt(value).toLocaleString();
    } else {
        input.value = '';
    }
}

/**
 * [변경] 구글 폼 대신 JSON 객체를 생성하여 콘솔에 출력합니다.
 */
function generateJSONData() {
    const name = document.getElementById('name').value;
    const year = document.getElementById('year').value;
    const brand = document.getElementById('brand').value;
    const type = document.getElementById('type').value;
    const fuel = document.getElementById('fuel').value;
    const size = document.getElementById('size').value;
    const price = document.getElementById('price').value;

    if (!name || !year) {
        alert("자동차 이름과 연식은 필수 입력 사항입니다.");
        return;
    }

    // data.json 형식에 맞춘 객체 생성
    const newEntry = {
        name: name,
        year: year,
        brand: brand,
        type: type,
        fuel: fuel,
        size: size,
        price: price
    };

    // 1. 콘솔에 출력 (사용자가 복사할 수 있도록)
    console.log("▼ 아래 코드를 복사하여 data.json의 [ ] 안에 추가하세요.");
    console.log(JSON.stringify(newEntry, null, 2) + ",");

    // 2. 알림 및 정리
    alert("데이터 객체가 생성되었습니다.\nF12(개발자 도구) 콘솔창에서 코드를 복사하여 data.json에 추가해 주세요.");
    
    modal.style.display = 'none';
    carForm.reset();
}

/**
 * [변경] 구글 시트 대신 깃허브의 data.json 파일을 읽어옵니다.
 */
function loadLocalData() {
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error("data.json 파일을 찾을 수 없습니다.");
            return response.json();
        })
        .then(data => {
            console.log("데이터 로드 성공:", data);
            renderTable(data);
        })
        .catch(error => {
            console.error("데이터 로딩 중 에러:", error);
            // 파일이 아직 없는 경우를 대비해 빈 배열로 렌더링
            renderTable([]);
        });
}

/**
 * 테이블 렌더링 함수
 */
function renderTable(data) {
    const tbody = document.getElementById('db-body');
    if (!tbody) return;
    
    tbody.innerHTML = ''; 

    data.forEach(car => {
        const row = `<tr>
            <td>📄 <strong>${car.name || '-'}</strong></td>
            <td>${car.year || '-'}</td>
            <td>${car.brand || '-'}</td>
            <td>${car.type || '-'}</td>
            <td>${car.fuel || '-'}</td>
            <td>${car.size || '-'}</td>
            <td>${car.price || '0'}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}