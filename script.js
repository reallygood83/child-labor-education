// Firebase 설정
const firebaseConfig = {
    // Firebase 콘솔에서 가져온 설정값을 여기에 넣으세요
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', function() {
    // 로그인 상태 확인
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // 로그인된 경우 저장된 데이터 불러오기
            loadSavedData(user.uid);
        } else {
            // 로그인되지 않은 경우 로그인 요청
            requestLogin();
        }
    });

    // 저장하기 버튼 기능
    const saveButtons = document.querySelectorAll('.save-btn');
    saveButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const user = auth.currentUser;
            if (!user) {
                alert('저장하기 위해서는 로그인이 필요합니다.');
                return;
            }

            const targets = this.getAttribute('data-target').split(',');
            const data = {};
            
            targets.forEach(target => {
                const element = document.getElementById(target);
                if (element) {
                    data[target] = element.value;
                }
            });
            
            try {
                // Firestore에 데이터 저장
                await db.collection('userData').doc(user.uid).set(data, { merge: true });
                
                // 저장 성공 애니메이션
                this.classList.add('save-success');
                setTimeout(() => {
                    this.classList.remove('save-success');
                }, 1000);

                // 저장 형식 선택 다이얼로그 표시
                const saveFormat = await showSaveFormatDialog();
                if (saveFormat) {
                    const containerId = this.closest('.activity-container').id;
                    if (saveFormat === 'pdf') {
                        await saveAsPDF(containerId, `학습내용_${containerId}`);
                    } else if (saveFormat === 'image') {
                        await saveAsImage(containerId, `학습내용_${containerId}`);
                    }
                }
                
                alert('입력하신 내용이 저장되었습니다.');
            } catch (error) {
                console.error('Error saving data:', error);
                alert('저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
            }
        });
    });
    
    // 표현 카드 단어 선택 기능
    const wordCards = document.querySelectorAll('.word-card');
    const selectedWordInputs = document.querySelectorAll('.selected-word');
    let selectedWords = [];
    
    wordCards.forEach(card => {
        card.addEventListener('click', function() {
            const word = this.getAttribute('data-word');
            
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                const index = selectedWords.indexOf(word);
                if (index > -1) {
                    selectedWords.splice(index, 1);
                }
            } 
            else if (selectedWords.length < 3) {
                this.classList.add('selected');
                selectedWords.push(word);
            }
            
            for (let i = 0; i < Math.min(selectedWords.length, 3); i++) {
                if (selectedWordInputs[i]) {
                    selectedWordInputs[i].value = selectedWords[i];
                }
            }
            
            for (let i = selectedWords.length; i < 3; i++) {
                if (selectedWordInputs[i]) {
                    selectedWordInputs[i].value = '';
                }
            }
        });
    });

    // 이미지 팝업 기능 초기화
    initImagePopup();
});

// 로그인 요청 함수
function requestLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('로그인 성공:', result.user);
        })
        .catch((error) => {
            console.error('로그인 실패:', error);
            alert('로그인에 실패했습니다. 다시 시도해 주세요.');
        });
}

// 저장된 데이터 불러오기 함수
async function loadSavedData(userId) {
    try {
        const doc = await db.collection('userData').doc(userId).get();
        if (doc.exists) {
            const data = doc.data();
            Object.keys(data).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = data[key];
                }
            });
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// PDF 생성 및 저장 함수
async function saveAsPDF(elementId, fileName) {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        // HTML을 캔버스로 변환
        const canvas = await html2canvas(element, {
            scale: 2, // 고해상도
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // PDF 생성
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210; // A4 너비
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

        // PDF 저장
        pdf.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error('PDF 생성 중 오류:', error);
        alert('PDF 저장 중 오류가 발생했습니다.');
    }
}

// 이미지로 저장 함수
async function saveAsImage(elementId, fileName) {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // 이미지 다운로드 링크 생성
        const link = document.createElement('a');
        link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('이미지 저장 중 오류:', error);
        alert('이미지 저장 중 오류가 발생했습니다.');
    }
}

// 저장 형식 선택 다이얼로그
function showSaveFormatDialog() {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'save-format-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>저장 형식 선택</h3>
                <p>학습 내용을 어떤 형식으로 저장하시겠습니까?</p>
                <div class="dialog-buttons">
                    <button class="btn" data-format="pdf">PDF로 저장</button>
                    <button class="btn" data-format="image">이미지로 저장</button>
                    <button class="btn cancel">취소</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        const buttons = dialog.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const format = button.dataset.format;
                dialog.remove();
                resolve(format);
            });
        });
    });
}

// 이미지 팝업 기능 초기화
function initImagePopup() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.getElementsByClassName('close')[0];

    if(!modal || !modalImg || !closeBtn) {
        console.error('모달 요소를 찾을 수 없습니다.');
        return;
    }

    // 모든 이미지와 크게 보기 버튼에 이벤트 리스너 추가
    document.querySelectorAll('.content-image, .view-full-btn').forEach(element => {
        element.addEventListener('click', function(e) {
            console.log('이미지 또는 버튼 클릭됨', e.target);
            if (e.target.classList.contains('view-full-btn')) {
                // 크게 보기 버튼 클릭 시 해당 이미지의 src 가져오기
                const img = e.target.parentElement.querySelector('.content-image');
                console.log('찾은 이미지:', img);
                if(img) {
                    modalImg.src = img.src;
                    modal.style.display = 'block';
                }
            } else {
                // 이미지 클릭 시 해당 이미지의 src 가져오기
                modalImg.src = e.target.src;
                modal.style.display = 'block';
            }
        });
    });

    // 닫기 버튼 클릭 시 모달 닫기
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // 모달 바깥 클릭 시 모달 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });

    console.log('이미지 팝업 기능 초기화 완료');
} 
