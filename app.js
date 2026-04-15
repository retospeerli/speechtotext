(() => {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");
  const output = document.getElementById("output");
  const statusEl = document.getElementById("status");
  const supportInfo = document.getElementById("supportInfo");

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  let recognition = null;
  let isRecording = false;
  let finalTranscript = "";

  function setStatus(text, recording = false) {
    statusEl.textContent = text;
    statusEl.classList.toggle("recording", recording);
  }

  function normalizeText(text) {
    let t = text || "";

    t = t.replace(/\s+/g, " ");
    t = t.replace(/\s([,.;:!?])/g, "$1");
    t = t.replace(/([,.;:!?])([^\s])/g, "$1 $2");
    t = t.trim();

    if (!t) return "";

    t = t.charAt(0).toUpperCase() + t.slice(1);

    t = t.replace(/([.!?]\s+)([a-zäöü])/g, (_, p1, p2) => {
      return p1 + p2.toUpperCase();
    });

    return t;
  }

  function updateTextarea() {
    output.value = normalizeText(finalTranscript);
  }

  function initRecognition() {
    if (!SpeechRecognition) {
      supportInfo.textContent =
        "Spracherkennung wird in diesem Browser leider nicht unterstützt.";
      setStatus("Nicht unterstützt");
      startBtn.disabled = true;
      stopBtn.disabled = true;
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "de-CH";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isRecording = true;
      setStatus("Aufnahme läuft", true);
      startBtn.disabled = true;
      stopBtn.disabled = false;
    };

    recognition.onend = () => {
      isRecording = false;
      setStatus("Bereit");
      startBtn.disabled = false;
      stopBtn.disabled = true;
      updateTextarea();
    };

    recognition.onerror = (event) => {
      let message = "Fehler bei der Spracherkennung";

      if (event.error === "not-allowed") {
        message = "Mikrofon-Zugriff wurde nicht erlaubt";
      } else if (event.error === "no-speech") {
        message = "Keine Sprache erkannt";
      } else if (event.error === "audio-capture") {
        message = "Kein Mikrofon gefunden";
      }

      setStatus(message);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let newFinal = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          newFinal += transcript + " ";
        } else {
          interimTranscript += transcript + " ";
        }
      }

      if (newFinal) {
        finalTranscript += newFinal;
      }

      output.value = normalizeText(finalTranscript + interimTranscript);
    };
  }

  async function copyText() {
    const text = output.value.trim();

    if (!text) {
      setStatus("Kein Text zum Kopieren");
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        output.focus();
        output.select();
        document.execCommand("copy");
      }

      setStatus("Text wurde kopiert");
    } catch (error) {
      setStatus("Kopieren nicht möglich");
      console.error(error);
    }
  }

  startBtn.addEventListener("click", () => {
    if (!recognition) return;

    try {
      recognition.start();
    } catch (error) {
      console.error(error);
    }
  });

  stopBtn.addEventListener("click", () => {
    if (!recognition || !isRecording) return;
    recognition.stop();
  });

  copyBtn.addEventListener("click", copyText);

  clearBtn.addEventListener("click", () => {
    finalTranscript = "";
    output.value = "";
    setStatus("Text gelöscht");
  });

  initRecognition();
})();
