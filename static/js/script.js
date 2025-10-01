document.addEventListener('DOMContentLoaded', () => {
    // --- Elementleri Seçme ---
    const navLinks = document.querySelectorAll('.nav-link');
    const contentViews = document.querySelectorAll('.content-view');
    const generateBtn = document.getElementById('generate-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const modal = document.getElementById('details-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalDownloads = document.getElementById('modal-downloads');
    const historyTableBody = document.querySelector('#history-table tbody');
    let fullHistoryData = [];

    // --- Olay Dinleyicilerini Ekleme ---
    navLinks.forEach(link => { /* ... (öncekiyle aynı, değişiklik yok) ... */ });
    generateBtn.addEventListener('click', generateDocuments);
    historyTableBody.addEventListener('click', handleHistoryTableClick); // Artık silme işlemlerini de yönetecek
    modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', event => { if (event.target === modal) modal.classList.add('hidden'); });
    modalBody.addEventListener('click', handleModalBodyClick);

    // --- Ana Fonksiyonlar ---
    async function generateDocuments() {
        // ... (Bu fonksiyon öncekiyle aynı, değişiklik yok)
        const topic = document.getElementById('topic').value;
        const subTopic = document.getElementById('sub-topic').value.trim();
        const count = document.getElementById('question-count').value;
        const isVisual = document.getElementById('is-visual').checked;
        const questionType = document.getElementById('question-type').value;

        if (!subTopic) { showError("Lütfen bir alt konu belirtin."); return; }
        setLoading(true);

        try {
            const response = await fetch('/generate-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, sub_topic: subTopic, count, is_visual: isVisual, question_type: questionType }),
            });
            const newEntry = await response.json();
            if (!response.ok) throw new Error(newEntry.error || 'Sunucu hatası.');

            // --- BUTON SORUNUNU ÇÖZEN SATIR ---
            fullHistoryData.unshift(newEntry);

            document.querySelector('.nav-link[data-target="history-view"]').click();
            displayDetailsInModal(newEntry);

        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadHistory() {
        try {
            const response = await fetch('/history');
            fullHistoryData = await response.json(); // Yerel veriyi güncelle
            historyTableBody.innerHTML = '';
            if (fullHistoryData.length === 0) {
                historyTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Henüz bir döküman oluşturulmadı.</td></tr>';
                return;
            }
            fullHistoryData.forEach(item => {
                const row = historyTableBody.insertRow();
                const formattedDate = new Date(item.timestamp).toLocaleString('tr-TR');
                // YENİ: Silme butonu eklendi
                row.innerHTML = `<td>${item.topic}</td><td>${item.count}</td><td>${formattedDate}</td>
                <td>
                    <button class="action-button" data-id="${item.id}" data-action="view">İnteraktif Görüntüle</button>
                    <button class="action-button delete-button" data-id="${item.id}" data-action="delete">Sil</button>
                </td>`;
            });
        } catch (error) { showError("Geçmiş verileri yüklenemedi: " + error.message); }
    }

    function displayDetailsInModal(item) { /* ... (öncekiyle aynı, değişiklik yok) ... */ }

    // --- GÜNCELLENDİ: Olay Yönlendirme Fonksiyonları ---
    function handleHistoryTableClick(event) {
        const target = event.target;
        const action = target.getAttribute('data-action');
        const itemId = target.getAttribute('data-id');

        if (!action || !itemId) return;

        if (action === 'view') {
            const item = fullHistoryData.find(d => d.id === itemId);
            if (item) displayDetailsInModal(item);
        } else if (action === 'delete') {
            if (confirm("Bu soru setini ve ilişkili tüm dosyaları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
                deleteHistoryItem(itemId);
            }
        }
    }

    // YENİ: Silme İşlemini Yapan Fonksiyon
    async function deleteHistoryItem(itemId) {
        try {
            const response = await fetch(`/delete-item/${itemId}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Silme işlemi sırasında bir hata oluştu.');
            }
            // Silme başarılıysa, geçmişi yeniden yükle
            loadHistory();
        } catch (error) {
            showError(error.message);
        }
    }

    function handleModalBodyClick(event) { /* ... (öncekiyle aynı, değişiklik yok) ... */ }
    // ... (Yardımcı fonksiyonlar: speakText, setLoading, showError öncekiyle aynı)
    // ...
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            contentViews.forEach(view => view.classList.toggle('hidden', view.id !== targetId));
            if (targetId === 'history-view') loadHistory();
        });
    });

    function displayDetailsInModal(item) {
        modalTitle.textContent = item.topic;
        modalBody.innerHTML = '';
        (item.questions || []).forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            let svgHTML = q.svg_image && q.svg_image.trim() ? `<div class="svg-container">${q.svg_image}</div>` : '';
            let optionsHTML = '';
            if (q.options && q.options.length > 0) {
                optionsHTML = '<ol class="options-list">';
                q.options.forEach((option, idx) => {
                    const isCorrect = (idx === q.correct_answer_index);
                    optionsHTML += `<li class="${isCorrect ? 'correct-option' : ''}">${option}</li>`;
                });
                optionsHTML += '</ol>';
            }
            const solutionSteps = q.solution_steps.map(step => `<li>${step}</li>`).join('');
            const textToSpeak = q.solution_steps.join('. ');
            let answerText = q.options && q.correct_answer_index !== undefined ? `Doğru Cevap: ${q.options[q.correct_answer_index]}` : `Cevap: ${q.answer}`;
            questionDiv.innerHTML = `<h3>Soru ${index + 1}</h3><p>${q.question}</p>${svgHTML}${optionsHTML}
                <div class="solution-container"><h4>Çözüm Adımları:</h4><ul>${solutionSteps}</ul><p class="solution-answer">${answerText}</p>
                <button class="tts-button" data-text="${encodeURIComponent(textToSpeak)}">🔊 Çözümü Seslendir</button></div>`;
            modalBody.appendChild(questionDiv);
        });
        modalDownloads.innerHTML = `<a href="/download/${item.files.questions_word}" class="download-link">Sorular (docx)</a><a href="/download/${item.files.solutions_word}" class="download-link">Çözümler (docx)</a>`;
        modal.classList.remove('hidden');
    }

    function handleModalBodyClick(event) {
        if (event.target.classList.contains('tts-button')) {
            const text = decodeURIComponent(event.target.getAttribute('data-text'));
            speakText(text);
        }
    }

    function speakText(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'tr-TR';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        } else { alert('Tarayıcınız sesli anlatım özelliğini desteklemiyor.'); }
    }
    function setLoading(isLoading) {
        loadingSpinner.classList.toggle('hidden', !isLoading);
        generateBtn.disabled = isLoading;
        errorMessage.classList.add('hidden');
    }
    function showError(message) {
        errorMessage.textContent = `Hata: ${message}`;
        errorMessage.classList.remove('hidden');
    }
});