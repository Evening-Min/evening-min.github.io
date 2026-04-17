// 변수를 함수 밖 상단에 선언하여 어디서든 접근 가능하게 합니다.
let modal, btnOpen, btnCancel, btnNext, carForm;

document.addEventListener('DOMContentLoaded', () => {
    // 요소 할당
    modal = document.getElementById('modal-container');
    btnOpen = document.getElementById('btn-open-modal');
    btnCancel = document.getElementById('btn-cancel');
    btnNext = document.getElementById('btn-next');
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

    // 3. 전송 버튼 (문제의 btnNext)
    if (btnNext) {
        btnNext.onclick = sendDataToGoogleForm;
    }

    // 초기 데이터 로드
    loadGoogleSheetData();
});

// 가격 쉼표 함수 (전역)
function formatPrice(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value) {
        input.value = parseInt(value).toLocaleString();
    } else {
        input.value = '';
    }
}

// 구글 폼 전송 함수
function sendDataToGoogleForm() {
    const name = document.getElementById('name').value;
    const year = document.getElementById('year').value;
    const brand = document.getElementById('brand').value;
    const type = document.getElementById('type').value;
    const fuel = document.getElementById('fuel').value;
    const size = document.getElementById('size').value;
    const price = document.getElementById('price').value;

    if (!name || !year) {
        alert("이름과 연식은 필수입니다.");
        return;
    }

    const goReview = confirm("입력하신 데이터를 기반으로 시승기를 작성하시겠습니까?");

    const googleFormURL = "https://docs.google.com/forms/d/e/1FAIpQLSeq-Ny9AshnJ841POl85ygitea4kEvH3g5cR3gEyACa26_3Jw/formResponse";
    
    const tempForm = document.createElement('form');
    tempForm.action = googleFormURL;
    tempForm.method = 'POST';
    tempForm.target = 'hidden_iframe';

    const entries = {
        'entry.1616301839': name,
        'entry.449053544': year,
        'entry.860691978': brand,
        'entry.1608184094': type,
        'entry.839717008': fuel,
        'entry.1661905578': size,
        'entry.1293346139': price
    };

    for (let key in entries) {
        let input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = entries[key];
        tempForm.appendChild(input);
    }

    if (!document.getElementById('hidden_iframe')) {
        const iframe = document.createElement('iframe');
        iframe.id = 'hidden_iframe';
        iframe.name = 'hidden_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }

    document.body.appendChild(tempForm);
    tempForm.submit();
    
    alert("데이터 전송을 시도했습니다.");
    document.body.removeChild(tempForm);
    modal.style.display = 'none';
    carForm.reset();

    if (goReview) {
        alert("시승기 에디터 페이지로 이동합니다.");
        // window.location.href = 'editor.html';
    } else {
        setTimeout(() => loadGoogleSheetData(), 2000);
    }
}

// 구글 시트 로드 함수
function loadGoogleSheetData() {
    const sheetLink = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRxm1_clIhpZcm4FyCiaEVwGS0BFNFrCakvOftnn8A4ujje9hnp5ZxqncW9np4SXHZdKdp3IzIyEYz_/pub?output=csv";

    Papa.parse(sheetLink, {
        download: true,
        header: true,
        complete: function(results) {
            renderTable(results.data);
        },
        error: function(err) {
            console.warn("로컬 환경에서는 구글 시트를 직접 불러올 수 없습니다. 깃허브에 올려서 확인하세요.");
        }
    });
}

function renderTable(data) {
    const tbody = document.getElementById('db-body');
    if(!tbody) return;
    tbody.innerHTML = ''; 
    data.forEach(car => {
        if(car.자동차이름 || car['Aa 자동차 이름']) {
            const row = `<tr>
                <td>📄 <strong>${car.자동차이름 || car['Aa 자동차 이름']}</strong></td>
                <td>${car.연식 || car['# 연식']}</td>
                <td>${car.브랜드 || car['▽ 브랜드']}</td>
                <td>${car.형식 || car['▽ 형식']}</td>
                <td>${car.연료 || car['▽ 연료 종류']}</td>
                <td>${car.크기 || car['▽ 크기']}</td>
                <td>${car.가격 || car['# 가격']}</td>
            </tr>`;
            tbody.innerHTML += row;
        }
    });
}
