// Naadi Parikshan Quiz & VedNidan Healthcare Solutions (B2B) Module

const NaadiQuiz = {
  questions: [
    {
      id: 'q1',
      title: '1. आपकी शारीरिक बनावट व त्वचा कैसी है? (Body Frame & Skin)',
      options: [
        { dosha: 'vata', label: 'दुबला शरीर, रूखी त्वचा, जल्दी ठंड लगना (Thin frame, dry skin, feels cold easily)', checked: true },
        { dosha: 'pitta', label: 'मध्यम कद, गर्म शरीर, पसीना व संवेदनशील त्वचा (Medium build, warm body, sensitive skin)' },
        { dosha: 'kapha', label: 'सुडौल/भारी शरीर, चिकनी त्वचा, धीमी गति (Sturdy/heavy build, smooth skin, steady pace)' }
      ]
    },
    {
      id: 'q2',
      title: '2. आपकी पाचन शक्ति व भूख कैसी रहती है? (Agni / Digestion)',
      options: [
        { dosha: 'vata', label: 'अनियमित भूख, गैस, अफारा या कब्ज की प्रवृत्ति (Irregular appetite, gas, bloating or constipation)' },
        { dosha: 'pitta', label: 'तीव्र भूख, भोजन देर से मिलने पर एसिडिटी/जलन (Strong appetite, acidity or burning if meal is delayed)', checked: true },
        { dosha: 'kapha', label: 'मंद पाचन, भोजन के बाद भारीपन या आलस्य (Slow digestion, heaviness or lethargy after meals)' }
      ]
    },
    {
      id: 'q3',
      title: '3. नींद और मानसिक स्वभाव कैसा है? (Sleep & Mental Nature)',
      options: [
        { dosha: 'vata', label: 'हल्की नींद, चंचल मन, चिंता या तनाव जल्दी होना (Light sleep, restless mind, quick anxiety)' },
        { dosha: 'pitta', label: 'तीक्ष्ण बुद्धि, जल्दी गुस्सा आना, मध्यम नींद (Sharp intellect, quick anger, moderate sleep)' },
        { dosha: 'kapha', label: 'गहरी व लंबी नींद, शांत व धैर्यवान स्वभाव (Deep long sleep, calm & patient nature)', checked: true }
      ]
    },
    {
      id: 'q4',
      title: '4. आपकी नाड़ी की गति व तापमान पसंद कैसी है? (Naadi Pace & Temperature Preference)',
      options: [
        { dosha: 'vata', label: 'तेज व अनियमित नाड़ी (सर्प गति), गर्म वातावरण पसंद (Fast/irregular pulse, prefers warmth)' },
        { dosha: 'pitta', label: 'तीक्ष्ण व उछलती हुई नाड़ी (मंडूक गति), ठंडा वातावरण पसंद (Bounding pulse, prefers cool weather)' },
        { dosha: 'kapha', label: 'धीमी, स्थिर व गहरी नाड़ी (हंस गति), सामान्य/गर्म मौसम पसंद (Slow steady pulse, dislikes damp cold)' }
      ]
    },
    {
      id: 'q5',
      title: '5. जोड़, बाल एवं ऊर्जा स्तर कैसा रहता है? (Joints, Hair & Stamina)',
      options: [
        { dosha: 'vata', label: 'जोड़ों में कड़कड़ाहट, रूखे बाल, ऊर्जा जल्दी कम होना (Cracking joints, dry hair, bursts of energy)' },
        { dosha: 'pitta', label: 'बालों का जल्दी झड़ना/सफेद होना, मध्यम पर तेज ऊर्जा (Early greying/hair fall, intense energy)' },
        { dosha: 'kapha', label: 'मजबूत जोड़, घने बाल, लंबे समय तक टिकने वाली ऊर्जा (Strong joints, thick hair, high endurance)' }
      ]
    },
    {
      id: 'q6',
      title: '6. आपकी वाणी, स्मरण शक्ति व निर्णय क्षमता कैसी है? (Speech & Memory)',
      options: [
        { dosha: 'vata', label: 'तेज बोलना, जल्दी सीखना पर जल्दी भूलना (Fast speech, quick to learn and quick to forget)' },
        { dosha: 'pitta', label: 'स्पष्ट व तार्किक वाणी, सटीक स्मरण शक्ति (Sharp decisive speech, clear focused memory)' },
        { dosha: 'kapha', label: 'मधुर व धीमी वाणी, धीरे सीखना पर लंबे समय तक याद रखना (Calm sweet speech, strong long-term memory)' }
      ]
    },
    {
      id: 'q7',
      title: '7. मल प्रवृत्ति एवं पसीना कैसा आता है? (Bowel Habit & Perspiration)',
      options: [
        { dosha: 'vata', label: 'कम पसीना, सूखा/कड़ा मल या अनियमित पेट साफ होना (Scanty sweat, dry or irregular stools)' },
        { dosha: 'pitta', label: 'अधिक पसीना व गंध, दिन में 2+ बार पतला/गर्म मल (Profuse sweat, frequent/loose stools)' },
        { dosha: 'kapha', label: 'सामान्य पसीना, ठोस व नियमित मल (Moderate sweat, well-formed regular stools)' }
      ]
    }
  ],

  lastResultText: '',

  init() {
    this.renderQuestions();
  },

  renderQuestions() {
    const container = document.getElementById('naadi-questions-container');
    if (!container) return;

    container.innerHTML = this.questions.map(q => `
      <div class="naadi-question-card">
        <div class="naadi-question-title">${q.title}</div>
        <div class="naadi-options-grid">
          ${q.options.map((opt, idx) => `
            <label class="naadi-option-label ${opt.checked ? 'selected' : ''}" onclick="NaadiQuiz.highlightOption('${q.id}', this)">
              <input type="radio" name="${q.id}" value="${opt.dosha}" ${opt.checked ? 'checked' : ''}>
              <span>${opt.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');
  },

  highlightOption(qId, labelEl) {
    const card = labelEl.closest('.naadi-question-card');
    if (!card) return;
    card.querySelectorAll('.naadi-option-label').forEach(l => l.classList.remove('selected'));
    labelEl.classList.add('selected');
  },

  analyze() {
    let vata = 0, pitta = 0, kapha = 0;
    const total = this.questions.length;

    this.questions.forEach(q => {
      const selected = document.querySelector(`input[name="${q.id}"]:checked`);
      const val = selected ? selected.value : 'vata';
      if (val === 'vata') vata++;
      else if (val === 'pitta') pitta++;
      else if (val === 'kapha') kapha++;
    });

    const vPct = Math.round((vata / total) * 100);
    const pPct = Math.round((pitta / total) * 100);
    const kPct = Math.max(0, 100 - vPct - pPct);

    let dominantLabel = 'त्रिदोष सम (Tridoshic Balanced)';
    let advice = 'आपकी वात-पित्त-कफ तीनों ऊर्जाएं संतुलित हैं। मौसमी दिनचर्या और सात्विक आहार का पालन करें।';

    if (vata > pitta && vata > kapha) {
      dominantLabel = 'वात प्रधान प्रकृति (Vata Dominant)';
      advice = 'गर्म, स्निग्ध (घी/तिल तेल युक्त) व ताजा भोजन लें। ठंडी हवा, सूखे भोजन व देर रात जागने से बचें। अश्वगंधा व दशमूल रसायन लाभकारी हैं।';
    } else if (pitta > vata && pitta > kapha) {
      dominantLabel = 'पित्त प्रधान प्रकृति (Pitta Dominant)';
      advice = 'शीतल, मीठे व ताजे फल-सब्जियों का सेवन करें। अधिक मिर्च-मसाला, खट्टा व धूप से बचें। आंवला, शतावरी व गिलोय लाभकारी हैं।';
    } else if (kapha > vata && kapha > pitta) {
      dominantLabel = 'कफ प्रधान प्रकृति (Kapha Dominant)';
      advice = 'हल्का, गर्म व सुपाच्य भोजन लें। नियमित व्यायाम/योग करें और दिन में सोने व अधिक मीठे-तले भोजन से बचें। त्रिकटु व तुलसी-गिलोय लाभकारी हैं।';
    } else if (vata === pitta && vata > kapha) {
      dominantLabel = 'वात-पित्त मिश्रित प्रकृति (Vata-Pitta Dual)';
      advice = 'संतुलित, हल्का गर्म और कम मसालेदार भोजन लें। नियमित विश्राम व ब्राह्मी/शतावरी का सेवन उपयुक्त है।';
    } else if (pitta === kapha && pitta > vata) {
      dominantLabel = 'पित्त-कफ मिश्रित प्रकृति (Pitta-Kapha Dual)';
      advice = 'ताजा, हल्का व कम तैलीय भोजन अपनाएं। प्रातःकाल योग और त्रिफला चूर्ण पाचन संतुलन के लिए उत्तम है।';
    } else if (vata === kapha && vata > pitta) {
      dominantLabel = 'वात-कफ मिश्रित प्रकृति (Vata-Kapha Dual)';
      advice = 'गर्म तासीर वाला सुपाच्य भोजन व अदरक-तुलसी हर्बल चाय लाभकारी है।';
    }

    this.lastResultText = dominantLabel;

    const resultCard = document.getElementById('naadi-result-card');
    if (resultCard) {
      resultCard.classList.add('active');
      document.getElementById('naadi-dominant-title').textContent = dominantLabel;
      document.getElementById('naadi-advice-text').textContent = advice;
      document.getElementById('naadi-vata-pct').textContent = `${vPct}%`;
      document.getElementById('naadi-pitta-pct').textContent = `${pPct}%`;
      document.getElementById('naadi-kapha-pct').textContent = `${kPct}%`;
      document.getElementById('naadi-vata-bar').style.width = `${vPct}%`;
      document.getElementById('naadi-pitta-bar').style.width = `${pPct}%`;
      document.getElementById('naadi-kapha-bar').style.width = `${kPct}%`;
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  consultAiWithResult() {
    const promptMsg = `मेरी प्रकृति "${this.lastResultText || 'त्रिदोष प्रकृति'}" निकली है। कृपया मेरी प्रकृति के अनुसार उचित दिनचर्या, पथ्य-अपथ्य और वेदनिदान की रसायन औषधियाँ सुझाएँ।`;
    if (typeof App !== 'undefined' && App.navigateTo) {
      App.navigateTo('doctor-page');
    }
    setTimeout(() => {
      const chatInput = document.getElementById('chat-input');
      if (chatInput) {
        chatInput.value = promptMsg;
        if (typeof Doctor !== 'undefined' && Doctor.sendMessage) {
          Doctor.sendMessage();
        }
      }
    }, 300);
  }
};

const B2BConsultancy = {
  selectService(serviceName) {
    if (typeof App !== 'undefined' && App.navigateTo) {
      App.navigateTo('b2b-page');
    }
    setTimeout(() => {
      const sel = document.getElementById('b2b-service-select');
      if (sel) sel.value = serviceName;
      const formCard = document.getElementById('b2b-inquiry-form-card');
      if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const nameInput = document.getElementById('b2b-contact-name');
        if (nameInput) nameInput.focus();
      }
    }, 150);
  },

  async submitInquiry(event) {
    event.preventDefault();
    const contactName = document.getElementById('b2b-contact-name').value.trim();
    const organizationName = document.getElementById('b2b-org-name').value.trim();
    const phone = document.getElementById('b2b-phone').value.trim();
    const city = document.getElementById('b2b-city').value.trim();
    const email = document.getElementById('b2b-email').value.trim();
    const service = document.getElementById('b2b-service-select').value;
    const requirements = document.getElementById('b2b-requirements').value.trim();

    const submitBtn = document.getElementById('b2b-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Submitting Inquiry...';
    }

    try {
      const apiBase = window.API_BASE || '/api';
      const res = await fetch(`${apiBase}/b2b/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactName, organizationName, phone, city, email, service, requirements })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Submission failed');

      const waText = encodeURIComponent(
        `Namaste VedNidan Healthcare Solutions,\n` +
        `Inquiry ID: ${data.inquiry.id}\n` +
        `Name: ${contactName}\n` +
        `Hospital/Firm: ${organizationName}\n` +
        `Mobile: ${phone} | City: ${city}\n` +
        `Service Required: ${service}\n` +
        `Details: ${requirements || 'Consultation requested'}`
      );
      const waUrl = `https://wa.me/918000108726?text=${waText}`;

      const successBox = document.getElementById('b2b-success-box');
      if (successBox) {
        successBox.style.display = 'block';
        successBox.innerHTML = `
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <i class="ri-checkbox-circle-fill" style="font-size:26px;color:#16a34a;"></i>
            <div>
              <h4 style="margin:0 0 4px;color:#0d3b26;">Consultation Request Submitted (#${data.inquiry.id})</h4>
              <p style="margin:0 0 12px;font-size:13px;color:#334155;">
                Your details have been sent directly to the <strong>VedNidan Healthcare Solutions Owner &amp; Admin Desk</strong>. Our team will contact you shortly on <strong>${phone}</strong>.
              </p>
              <a href="${waUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#16a34a;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">
                <i class="ri-whatsapp-line"></i> Also Send Directly on WhatsApp (+91 80001 08726)
              </a>
            </div>
          </div>
        `;
      }

      if (typeof showToast === 'function') {
        showToast('B2B Consultation Request sent to VedNidan Owner Desk!', 'success');
      }
      document.getElementById('b2b-inquiry-form').reset();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Error submitting inquiry', 'error');
      else alert(err.message || 'Error submitting inquiry');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="ri-send-plane-fill"></i> Submit Consultation Request to Owner Desk';
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  NaadiQuiz.init();
});
