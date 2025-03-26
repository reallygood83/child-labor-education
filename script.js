document.addEventListener('DOMContentLoaded', function() {
    // 저장하기 버튼 기능
    const saveButtons = document.querySelectorAll('.save-btn');
    saveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targets = this.getAttribute('data-target').split(',');
            
            targets.forEach(target => {
                const element = document.getElementById(target);
                if (element) {
                    // 실제로는 서버에 데이터를 저장하거나 localStorage에 저장할 수 있습니다
                    // 여기서는 간단히 저장 성공 애니메이션만 보여줍니다
                    localStorage.setItem(target, element.value);
                }
            });
            
            // 저장 성공 애니메이션
            this.classList.add('save-success');
            setTimeout(() => {
                this.classList.remove('save-success');
            }, 1000);
            
            // 저장 완료 메시지
            alert('입력하신 내용이 저장되었습니다.');
        });
    });
    
    // 표현 카드 단어 선택 기능
    const wordCards = document.querySelectorAll('.word-card');
    const selectedWordInputs = document.querySelectorAll('.selected-word');
    let selectedWords = [];
    
    wordCards.forEach(card => {
        card.addEventListener('click', function() {
            const word = this.getAttribute('data-word');
            
            // 이미 선택된 단어라면 선택 해제
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                const index = selectedWords.indexOf(word);
                if (index > -1) {
                    selectedWords.splice(index, 1);
                }
            } 
            // 최대 3개까지만 선택 가능
            else if (selectedWords.length < 3) {
                this.classList.add('selected');
                selectedWords.push(word);
            }
            
            // 선택한 단어를 입력 필드에 표시
            for (let i = 0; i < Math.min(selectedWords.length, 3); i++) {
                if (selectedWordInputs[i]) {
                    selectedWordInputs[i].value = selectedWords[i];
                }
            }
            
            // 선택 해제된 경우 빈칸으로
            for (let i = selectedWords.length; i < 3; i++) {
                if (selectedWordInputs[i]) {
                    selectedWordInputs[i].value = '';
                }
            }
        });
    });
    
    // 페이지 로드 시 저장된 데이터 불러오기
    function loadSavedData() {
        const inputElements = document.querySelectorAll('input[id], textarea[id]');
        inputElements.forEach(element => {
            const savedValue = localStorage.getItem(element.id);
            if (savedValue) {
                element.value = savedValue;
            }
        });
    }
    
    loadSavedData();
}); 