document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal-container');
    const btnOpen = document.getElementById('btn-open-modal');
    const btnCancel = document.getElementById('btn-cancel');
    const btnNext = document.getElementById('btn-next');
    const form = document.getElementById('car-form');

    // 1. 모달 열기
    btnOpen.onclick = () => modal.style.display = 'block';

    // 2. 취소 버튼 클릭 시 로직
    btnCancel.onclick = () => {
        if (confirm("입력된 내용은 저장되지 않습니다. 취소하시겠습니까?")) {
            form.reset();
            modal.style.display = 'none';
        }
    };

    // 3. 다음 버튼 클릭 시 로직
    btnNext.onclick = () => {
        // 필수 값 확인 (ESTJ답게 꼼꼼하게)
        if (!document.getElementById('name').value) {
            alert("자동차 이름을 입력해주세요.");
            return;
        }

        // 시승기 작성 여부 확인
        if (confirm("시승기를 작성하시겠습니까?")) {
            // '예'를 누른 경우
            alert("시승기 작성 페이지로 이동합니다. (현재 구현된 페이지가 없어 데이터만 저장합니다)");
            saveData();
            // window.location.href = "write-review.html"; // 나중에 연결할 페이지
        } else {
            // '아니오'를 누른 경우: 창을 닫지 않고 입력창 유지 (데이터만 저장하도록 처리 가능)
            console.log("시승기 작성을 건너뛰고 입력 정보를 유지합니다.");
        }
    };

    function saveData() {
        const tbody = document.getElementById('db-body');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>📄 <strong>${document.getElementById('name').value}</strong></td>
            <td>${document.getElementById('year').value}</td>
            <td>${document.getElementById('brand').value}</td>
            <td>${document.getElementById('type').value}</td>
            <td>${document.getElementById('fuel').value}</td>
            <td>${document.getElementById('size').value}</td>
            <td>${document.getElementById('price').value}</td>
        `;
        tbody.prepend(row);
        form.reset();
        modal.style.display = 'none';
    }
});