(function() {
  const defaultPrompts = {
    casual1: "Casual and friendly, slightly polished. Like talking to a familiar colleague.",
    casual2: "Very casual and relaxed. Like texting a close friend. Use slang and contractions naturally.",
    natural: "Natural native-speaker style. Clear, balanced, and authentic. Neither formal nor casual.",
    formal1: "Professional and polished. Suitable for business communication. Avoid slang and contractions.",
    formal2: "Highly formal and precise. Suitable for academic, legal, or official writing."
  };

  const grokPrompt = "Translate with an authentic online tone. Use natural slang, casual expressions, and internet language when appropriate. Avoid forced slang, excessive profanity, or exaggerated meme language.";

  const defaultGrammarPrompt = "Make the minimum necessary changes.";

  let currentLang = 'en';
  let currentMode = 'translate';
  let currentTone = 'natural';
  let isXvibe = false;
  let isToneExpanded = false;
  let isContextExpanded = false;
  const prompts = {
    casual1: defaultPrompts.casual1,
    casual2: defaultPrompts.casual2,
    natural: defaultPrompts.natural,
    formal1: defaultPrompts.formal1,
    formal2: defaultPrompts.formal2
  };
  let grammarPrompt = defaultGrammarPrompt;

  function $(id) { return document.getElementById(id); }

  const i18n = {
    zh: {
      translate: '翻译',
      grammar: '语法纠错',
      tone: '语气',
      casual1: '随意 I',
      casual2: '随意 II',
      natural: '自然',
      formal1: '正式 I',
      formal2: '正式 II',
      targetLangLabel: '目标语言',
      targetLangPlaceholder: '例如：英语、日语、法语',
      defaultTargetLang: 'English',
      toneInstructionsLabel: '语气要求（可编辑）',
      contextLabel: '使用场景',
      contextPlaceholder: '例如：发给导师的邮件、安慰朋友的消息、学术论文...',
      contextCollapsedLabel: '添加使用场景',
      textToTranslate: '输入要翻译的内容',
      translateBtn: '翻译',
      grammarPromptLabel: '额外要求（可选）',
      textToCheck: '输入要检查的文本',
      checkBtn: '开始检查',
      result: '结果',
      corrected: '纠正后',
      issues: '问题',
      copy: '复制',
      copied: '已复制',
      loading: '',
      errorEmpty: '请输入内容',
      phPrompt: '在此编辑对翻译风格的额外要求...',
      phText: '在此输入原文...',
      phGrammarPrompt: '例如：重点关注学术用词、邮件礼仪...',
      phGrammarText: '在此输入文本...',
      footerUsage: '使用说明',
      footerTroubleshoot: '常见问题',
      footerUsageText: '<strong>翻译：</strong>输入任意语言文本，选择目标语言。点击“语气”可切换五种风格（随意 I/II、自然、正式 I/II）；展开“使用场景”补充上下文，翻译更贴合情境。在“随意 II”下可点击 X-Vibe 使用 Grok 风格翻译。<br><strong>语法纠错：</strong>输入文本，在“额外要求”框中可指定检查方向（如学术用词、邮件礼仪），点击开始检查。<br><strong>快捷键：</strong>Ctrl+Enter 快捷提交。',
      footerTroubleshootText: '<strong>输出不完整？</strong>这是流式输出，Kimi 仍在推理中，请稍等。<br><strong>响应慢？</strong>Kimi API 推理时间较长，属正常现象。<br><strong>翻译质量不佳？</strong>尝试在"使用场景"中补充上下文，或调整目标语言。<br><strong>语法纠错无修改？</strong>说明原文已很通顺，或尝试在要求中指定检查重点。',
      footerCredits: '鸣谢',
      footerCreditsText: '<a href="https://www.moonshot.cn" target="_blank">Moonshot AI (Kimi K2.5)</a> — 翻译与语法引擎<br><a href="https://chatgpt.com/" target="_blank">GPT-5.5</a> — 系统提示词与设计理念<br>用户 — 设计理念与 UI 设计',
      grokCredit: '<a href="https://x.ai/" target="_blank">xAI (Grok)</a> — 翻译引擎',
      clear: '清空',
      reset: '重置',
      expand: '展开',
      collapse: '收起',
      xVibe: '想要X味翻译？看这里！',
      xVibeActive: 'Grok搞起！'
    },
    en: {
      translate: 'Translate',
      grammar: 'Grammar Check',
      tone: 'Tone',
      casual1: 'Casual I',
      casual2: 'Casual II',
      natural: 'Natural',
      formal1: 'Formal I',
      formal2: 'Formal II',
      targetLangLabel: 'Target language',
      targetLangPlaceholder: 'e.g. English, Japanese, French',
      defaultTargetLang: 'Chinese',
      toneInstructionsLabel: 'Instructions (Editable)',
      contextLabel: 'Usage scenario',
      contextPlaceholder: 'e.g. Email to supervisor, comforting a friend, academic paper...',
      contextCollapsedLabel: 'Add context',
      textToTranslate: 'Enter text to translate',
      translateBtn: 'Translate',
      grammarPromptLabel: 'Additional Focus (Optional)',
      textToCheck: 'Enter text to check',
      checkBtn: 'Check',
      result: 'Result',
      corrected: 'Corrected',
      issues: 'Issues',
      copy: 'Copy',
      copied: 'Copied',
      loading: '',
      errorEmpty: 'Please enter some text',
      phPrompt: 'Edit additional style instructions here...',
      phText: 'Enter source text here...',
      phGrammarPrompt: 'e.g. Focus on academic tone...',
      phGrammarText: 'Enter text here...',
      footerUsage: 'How to Use',
      footerTroubleshoot: 'Troubleshoot',
      footerUsageText: '<strong>Translate:</strong> Enter text in any language and pick the target language. Expand Tone to choose from five styles (Casual I/II, Natural, Formal I/II). Add context in Usage scenario for more accurate results. On Casual II, click X-Vibe to switch to Grok-style translation.<br><strong>Grammar Check:</strong> Enter text and optionally specify focus areas (e.g. academic tone, email etiquette) in the Additional Focus box, then click Check.<br><strong>Tip:</strong> Press Ctrl+Enter to submit.',
      footerTroubleshootText: '<strong>Incomplete output?</strong> This is streaming output; Kimi is still reasoning. Please wait.<br><strong>Slow response?</strong> Kimi API inference takes time. This is normal.<br><strong>Poor translation quality?</strong> Try adding context in "Usage scenario" or verify target language.<br><strong>No grammar changes?</strong> The original text may already be correct, or try specifying a focus area.',
      footerCredits: 'Credits',
      footerCreditsText: '<a href="https://www.moonshot.cn" target="_blank">Moonshot AI (Kimi K2.5)</a> — Translation & grammar engine<br><a href="https://chatgpt.com/" target="_blank">GPT-5.5</a> — System prompt & design philosophy<br>User — Design philosophy & UI design',
      grokCredit: '<a href="https://x.ai/" target="_blank">xAI (Grok)</a> — Translation engine',
      clear: 'Clear',
      reset: 'Reset',
      expand: 'Expand',
      collapse: 'Collapse',
      xVibe: 'want that X vibe?',
      xVibeActive: 'Grok it!'
    }
  };

  window.TranslatorI18n = {
    currentLang: function() { return currentLang; },
    currentMode: function() { return currentMode; },
    currentTone: function() { return currentTone; },
    isXvibe: function() { return isXvibe; },
    prompts: function() { return prompts; },
    grammarPrompt: function() { return grammarPrompt; },
    setLang: setLang,
    setMode: setMode,
    setTone: setTone,
    toggleToneExpand: toggleToneExpand,
    toggleContextExpand: toggleContextExpand,
    toggleXvibe: toggleXvibe,
    resetXvibe: resetXvibe,
    setLoading: setLoading,
    hideResult: hideResult,
    showResult: showResult,
    copyResult: copyResult,
    sendRequest: sendRequest,
    sendTranslate: sendTranslate,
    sendGrammar: sendGrammar,
    toggleTheme: toggleTheme,
    defaultPrompts: defaultPrompts,
    defaultGrammarPrompt: defaultGrammarPrompt,
    i18n: i18n,
    $: $
  };

  function updateXvibeUI() {
    const btn = $("btn-x-vibe");
    if (!btn) return;
    const t = i18n[currentLang];
    if (currentTone === 'casual2') {
      btn.style.display = '';
      if (isXvibe) {
        btn.textContent = t.xVibeActive;
        btn.classList.add("active");
      } else {
        btn.textContent = t.xVibe;
        btn.classList.remove("active");
      }
    } else {
      btn.style.display = 'none';
    }
  }

  function updateGrokCreditUI() {
    const creditEl = $("grok-credit");
    if (!creditEl) return;
    const t = i18n[currentLang];
    if (isXvibe && currentMode === 'translate') {
      creditEl.innerHTML = t.grokCredit || '';
      creditEl.style.display = '';
    } else {
      creditEl.style.display = 'none';
    }
  }

  function toggleXvibe() {
    if (currentTone !== 'casual2') return;
    isXvibe = !isXvibe;
    if (isXvibe) {
      $("tone-prompt").value = grokPrompt;
    } else {
      $("tone-prompt").value = prompts.casual2 || defaultPrompts.casual2;
    }
    updateXvibeUI();
    updateGrokCreditUI();
  }

  function resetXvibe() {
    isXvibe = false;
    updateXvibeUI();
    updateGrokCreditUI();
  }

  function toggleToneExpand() {
    isToneExpanded = !isToneExpanded;
    $("tone-collapsed").style.display = isToneExpanded ? 'none' : '';
    $("tone-expanded").style.display = isToneExpanded ? '' : 'none';
  }

  function toggleContextExpand() {
    isContextExpanded = !isContextExpanded;
    $("context-collapsed").style.display = isContextExpanded ? 'none' : '';
    $("context-expanded").style.display = isContextExpanded ? '' : 'none';
  }

  function updateContextCollapsedLabel() {
    const link = $("context-toggle-link");
    if (!link) return;
    const t = i18n[currentLang];
    const hasContent = $("context-input") && $("context-input").value.trim();
    // If expanded, don't update (collapsed view is hidden)
    if (isContextExpanded) return;
    link.textContent = hasContent ? t.contextLabel : t.contextCollapsedLabel;
  }

  function setLang(lang) {
    const prevLang = currentLang;
    currentLang = lang;
    const t = i18n[lang];

    $("tab-translate").textContent = t.translate;
    $("tab-grammar").textContent = t.grammar;
    $("btn-translate").textContent = t.translateBtn;
    $("btn-check").textContent = t.checkBtn;
    $("btn-copy").textContent = t.copy;
    $("loading-text").textContent = t.loading;

    // Target language
    $("label-target-lang").textContent = t.targetLangLabel;
    $("target-lang").placeholder = t.targetLangPlaceholder;
    // Update default if input is empty or still shows previous default
    const targetLangInput = $("target-lang");
    const prevDefault = i18n[prevLang].defaultTargetLang;
    const currentValue = targetLangInput.value.trim();
    if (!currentValue || currentValue === prevDefault) {
      targetLangInput.value = t.defaultTargetLang || "";
    }

    // Tone
    $("label-tone").textContent = t.tone;
    $("tone-toggle-link").textContent = t[currentTone] || t.natural;
    $("label-tone-instructions").textContent = t.toneInstructionsLabel;

    const items = document.querySelectorAll(".tone-item");
    items.forEach(function(item) {
      const tone = item.getAttribute("data-tone");
      const label = item.querySelector(".tone-label");
      if (tone === "casual1") label.textContent = t.casual1;
      else if (tone === "casual2") label.textContent = t.casual2;
      else if (tone === "natural") label.textContent = t.natural;
      else if (tone === "formal1") label.textContent = t.formal1;
      else if (tone === "formal2") label.textContent = t.formal2;
    });

    // Context
    $("label-context").textContent = t.contextLabel;
    $("context-input").placeholder = t.contextPlaceholder;
    updateContextCollapsedLabel();

    // Source text
    $("label-source").textContent = t.textToTranslate;

    // Grammar labels
    $("label-grammar-prompt").textContent = t.grammarPromptLabel;
    $("label-grammar-text").textContent = t.textToCheck;

    $("result-box").querySelector(".result-title").textContent = t.result;

    const correctedTitle = $("corrected-title");
    if (correctedTitle) correctedTitle.textContent = t.corrected;
    const issuesTitle = $("issues-title");
    if (issuesTitle) issuesTitle.textContent = t.issues;

    if (lang === 'zh') {
      $("btn-zh").classList.add("active");
      $("btn-en").classList.remove("active");
    } else {
      $("btn-zh").classList.remove("active");
      $("btn-en").classList.add("active");
    }

    $("tone-prompt").placeholder = t.phPrompt;
    $("translate-input").placeholder = t.phText;
    $("grammar-prompt").placeholder = t.phGrammarPrompt;
    $("grammar-input").placeholder = t.phGrammarText;
    $("footer-usage-label").textContent = t.footerUsage;
    $("footer-troubleshoot-label").textContent = t.footerTroubleshoot;
    $("footer-usage-text").innerHTML = t.footerUsageText;
    $("footer-troubleshoot-text").innerHTML = t.footerTroubleshootText;
    $("footer-credits-label").textContent = t.footerCredits;
    $("footer-credits-text").innerHTML = t.footerCreditsText;
    $("btn-clear").textContent = t.clear;
    $("btn-reset").textContent = t.reset;
    $("btn-grammar-clear").textContent = t.clear;
    $("btn-grammar-reset").textContent = t.reset;

    document.querySelectorAll('.accordion-item').forEach(function(item) {
      const content = item.querySelector('.accordion-content');
      const toggle = item.querySelector('.accordion-toggle');
      if (!content || !toggle) return;
      const isOpen = content.classList.contains('show');
      toggle.classList.toggle('open', isOpen);
      toggle.textContent = isOpen ? t.collapse : t.expand;
    });

    updateXvibeUI();
    updateGrokCreditUI();
  }

  function setMode(mode) {
    currentMode = mode;
    $("sec-translate").classList.toggle("active", mode === "translate");
    $("sec-grammar").classList.toggle("active", mode === "grammar");
    $("tab-translate").classList.toggle("active", mode === "translate");
    $("tab-grammar").classList.toggle("active", mode === "grammar");
    hideResult();
    updateGrokCreditUI();
    setLang(currentLang);
  }

  function setTone(tone) {
    prompts[currentTone] = $("tone-prompt").value;
    currentTone = tone;
    $("tone-prompt").value = prompts[tone];
    document.querySelectorAll(".tone-item").forEach(function(el) {
      el.classList.toggle("active", el.getAttribute("data-tone") === tone);
    });
    if (tone !== 'casual2') {
      resetXvibe();
    }
    const t = i18n[currentLang];
    $("tone-toggle-link").textContent = t[tone] || t.natural;
    updateXvibeUI();
  }

  function setLoading(show) {
    $("loading").classList.toggle("show", show);
    $("loading-spinner").classList.toggle("show", show);
    const img = $("loading-img");
    if (img) {
      img.src = (isXvibe && currentMode === 'translate') ? "loading2.svg" : "thinking.svg";
    }
  }

  function hideResult() {
    $("result-box").classList.remove("show");
  }

  function showResult(text, mode) {
    const body = $("result-body");
    const t = i18n[currentLang];
    if (mode === 'grammar') {
      let correctedText = '';
      let issuesText = '';
      const correctedIdx = text.indexOf('Corrected:');
      const issuesIdx = text.indexOf('Issues:');
      if (correctedIdx !== -1) {
        if (issuesIdx !== -1 && issuesIdx > correctedIdx) {
          correctedText = text.substring(correctedIdx + 10, issuesIdx).trim();
          issuesText = text.substring(issuesIdx + 7).trim();
        } else {
          correctedText = text.substring(correctedIdx + 10).trim();
        }
      } else {
        correctedText = text.trim();
      }
      if (!issuesText || issuesText.toLowerCase().indexOf('none') >= 0) {
        issuesText = 'none';
        correctedText = '✔';
      } else if (!correctedText) {
        correctedText = '✔';
      }
      let html = '<div class="grammar-section"><div class="grammar-section-title" id="corrected-title">' + escapeHtml(t.corrected) + '</div><div class="grammar-corrected">' + escapeHtml(correctedText) + '</div></div>';
      html += '<div class="grammar-section"><div class="grammar-section-title" id="issues-title">' + escapeHtml(t.issues) + '</div><div class="grammar-issues">' + formatIssues(issuesText) + '</div></div>';
      body.innerHTML = html;
    } else {
      const html = escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      body.innerHTML = html;
    }
    $("result-box").classList.add("show");
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatIssues(text) {
    if (text === 'none' || text === '✔') return '<span class="no-issues">' + text + '</span>';
    const lines = text.split('\n');
    let html = '<ul>';
    lines.forEach(function(line) {
      line = line.trim();
      if (line && line.charAt(0) === '-') {
        html += '<li>' + escapeHtml(line.substring(1).trim()) + '</li>';
      } else if (line) {
        html += '<li>' + escapeHtml(line) + '</li>';
      }
    });
    html += '</ul>';
    return html;
  }

  function copyResult() {
    const correctedEl = document.querySelector('.grammar-corrected');
    const text = correctedEl ? correctedEl.innerText : $("result-body").innerText;
    const btn = $("btn-copy");
    const orig = i18n[currentLang].copy;
    btn.textContent = i18n[currentLang].copied;
    setTimeout(function() { btn.textContent = orig; }, 1500);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(function() {});
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  async function sendRequest(mode, text, customPrompt, context, targetLang) {
    setLoading(true);
    hideResult();
    try {
      const parts = [];
      if (targetLang) parts.push('Translate to ' + targetLang + '.');
      if (customPrompt) parts.push(customPrompt);
      if (context) parts.push('Context: ' + context);
      const combinedPrompt = parts.join(' ');

      const provider = (mode === 'translate' && isXvibe) ? 'grok' : 'kimi';
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: mode, text: text, customPrompt: combinedPrompt, provider: provider })
      });
      if (!res.ok) {
        const errData = await res.json().catch(function() { return {}; });
        throw new Error(errData.detail || errData.error || ("HTTP " + res.status));
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      const resultBox = $("result-box");
      const resultBody = $("result-body");
      resultBody.textContent = "";
      resultBox.classList.add("show");
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || line.indexOf("data: ") !== 0) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            if (json.error) throw new Error(json.error.message || "API Error");
            const content = (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) || "";
            if (content) {
              fullText += content;
              resultBody.textContent = fullText;
            }
          } catch (e) {
            if (e.message && e.message.indexOf("API") >= 0) throw e;
          }
        }
      }
      if (fullText) {
        showResult(fullText, mode);
      } else {
        hideResult();
      }
    } catch (e) {
      alert("Error: " + e.message);
      hideResult();
    } finally {
      setLoading(false);
    }
  }

  function sendTranslate() {
    const text = $("translate-input").value.trim();
    if (!text) { alert(i18n[currentLang].errorEmpty); return; }
    prompts[currentTone] = $("tone-prompt").value;
    const tonePrompt = $("tone-prompt").value.trim();
    const context = $("context-input").value.trim();
    const targetLang = $("target-lang").value.trim();
    sendRequest("translate", text, tonePrompt, context, targetLang);
  }

  function sendGrammar() {
    const text = $("grammar-input").value.trim();
    if (!text) { alert(i18n[currentLang].errorEmpty); return; }
    grammarPrompt = $("grammar-prompt").value;
    const customPrompt = $("grammar-prompt").value.trim();
    sendRequest("grammar", text, customPrompt, null, null);
  }

  function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute("data-theme");
    const next = current === "dark" ? null : "dark";
    if (next) {
      html.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      $("btn-theme").innerHTML = "&#9790;";
    } else {
      html.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
      $("btn-theme").innerHTML = "&#9788;";
    }
  }

  window.addEventListener('DOMContentLoaded', function() {
    $("tone-prompt").value = prompts.natural;
    $("grammar-prompt").value = grammarPrompt;
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      $("btn-theme").innerHTML = "&#9790;";
    } else if (savedTheme === "light") {
      document.documentElement.removeAttribute("data-theme");
      $("btn-theme").innerHTML = "&#9788;";
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute("data-theme", "dark");
        $("btn-theme").innerHTML = "&#9790;";
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
        $("btn-theme").innerHTML = "&#9788;";
        localStorage.setItem("theme", "light");
      }
    }
    setLang("en");
  });
})();

