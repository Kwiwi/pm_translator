(function() {
  const defaultPrompts = {
    casual1: "Casual and friendly, slightly polished. Like talking to a familiar colleague.",
    casual2: "Casual and natural. Like texting a close friend. Use contractions and informal phrasing but avoid excessive profanity.",
    natural: "Natural native-speaker style. Clear, balanced, and authentic. Neither formal nor casual.",
    formal1: "Professional and polished. Suitable for business communication. Avoid slang and contractions.",
    formal2: "Highly formal and precise. Suitable for academic, legal, or official writing."
  };

  const grokPrompt = "Translate with maximum casual authenticity. Use natural slang, internet expressions, contractions, and cultural references as appropriate for the target language. Keep it raw, unfiltered, and vibe-heavy, but avoid excessive profanity or unnecessarily vulgar wording.Remember:focus on the style!";

  const grammarOnlyPrompt = "Make the minimum necessary changes.";

  let currentLang = 'en';
  let currentMode = 'translate';
  let currentTone = 'natural';
  let isXvibe = false;
  let isToneExpanded = false;
  let isMoreExpanded = false;
  const prompts = {
    casual1: defaultPrompts.casual1,
    casual2: defaultPrompts.casual2,
    natural: defaultPrompts.natural,
    formal1: defaultPrompts.formal1,
    formal2: defaultPrompts.formal2
  };
  let grammarPrompt = '';

  let technicalTerms = [];
  let isTermExpanded = false;

  // History
  let history = [];
  let historyIndex = -1;
  const MAX_HISTORY = 20;

  // Settings
  let isSettingsOpen = false;

  function $(id) { return document.getElementById(id); }

  const i18n = {
    zh: {
      translate: '翻译',
      grammar: '表达指导',
      tone: '语气',
      casual1: '随意 I',
      casual2: '随意 II',
      natural: '自然',
      formal1: '正式 I',
      formal2: '正式 II',
      targetLangLabel: '目标语言',
      targetLangPlaceholder: '例如：英语、日语、法语',
      defaultTargetLang: 'English',
      toneInstructionsLabel: '语气要求',
      moreLabel: '补充',
      morePlaceholder: '例如：用倒装句、不要使用[A]这个词、这是小说角色的口语片段...',
      moreCollapsedLabel: '添加备注',
      textToTranslate: '输入要翻译的内容',
      translateBtn: '翻译',
      grammarPromptLabel: '表达效果',
      textToCheck: '输入要润色的文本',
      checkBtn: '开始润色',
      result: '结果',
      polished: '润色后',
      corrected: '纠正后',
      changes: '改动说明',
      issues: '问题',
      copy: '复制',
      copied: '已复制',
      retry: '重试',
      retryFeedbackPlaceholder: '告诉模型如何调整',
      retrySubmit: '重新生成',
      retryPlain: '直接重试',
      retryCancel: '取消',
      loading: '',
      errorEmpty: '请输入内容',
      phPrompt: '在此编辑对翻译风格的额外要求...',
      phText: '在此输入原文...',
      phGrammarPrompt: '输入你希望达到的表达效果。例如：使用学术语气、让措辞更文学化、更像网络用语……',
      phGrammarText: '在此输入要润色的文本...',
      checkGrammarOnly: '只查语法',
      footerUsage: '使用说明',
      footerTroubleshoot: '常见问题',
      footerUsageText: '- <strong>翻译：</strong>输入任意语言文本，选择目标语言<br>- <strong>术语表：</strong>展开添加需固定译法或保留原文的术语<br>- <strong>语气：</strong>点击切换五种风格（随意 I/II、自然、正式 I/II）<br>- <strong>补充：</strong>添加任何额外翻译要求或上下文说明<br>- <strong>X-Vibe：</strong>在"随意 II"下点 X-Vibe 切换 Grok 风格<br>- <strong>表达指导：</strong>输入文本，在"表达效果"框中描述你想要的表达风格；点"只查语法"仅检查语法<br>- <strong>API Key：</strong>点击顶部设置按钮填入你自己的 Moonshot Key<br>- <strong>重试与历史：</strong>点"重试"输入反馈重新生成，用箭头翻阅最近 20 条输出<br>- <strong>快捷键：</strong>Ctrl+Enter 快捷提交',
      footerTroubleshootText: '<strong>输出不完整？</strong>这是流式输出，Kimi 仍在推理中，请稍等。<br><strong>响应慢？</strong>Kimi API 推理时间较长，属正常现象。<br><strong>翻译质量不佳？</strong>尝试调整目标语言或语气，或在"补充"中添加说明。<br><strong>润色后无修改？</strong>说明原文已很通顺，或尝试在"表达效果"中指定调整方向。<br><strong>API Key 隐私？</strong>你的 Key 仅保存在浏览器本地，通过加密 HTTPS 经 Cloudflare Worker 转发至 Moonshot，服务端不存储、不记录。<br><strong>错误代码说明：</strong>401/403 = Key 无效；429 = 请求过于频繁；502/503 = Moonshot 服务端异常；网络错误 = 请检查本地网络。',
      footerCredits: '鸣谢',
      footerCreditsText: '<a href="https://www.moonshot.cn" target="_blank">Moonshot AI (Kimi K2.6)</a> — 翻译与表达引擎<br><a href="https://chatgpt.com/" target="_blank">GPT-5.5 / GPT-5.6 Luna</a> — 系统提示词与设计理念<br>用户 — 设计理念与 UI 设计',
      grokCredit: '<a href="https://x.ai/" target="_blank">xAI (Grok)</a> — 翻译引擎',
      clear: '清空',
      reset: '重置',
      expand: '展开',
      collapse: '收起',
      xVibe: '想要X味翻译？看这里！',
      xVibeActive: 'Grok搞起！',
      term: '术语表',
      termToggleAdd: '添加术语',
      termTable: '术语表',
      termAdd: '添加',
      termClear: '清空',
      termEmpty: '暂无术语',
      termKeep: '保留原文',
      termTranslate: '翻译',
      termInputPh: '输入术语...',
      termTranslationPh: '指定译法',
      termGuidancePrefix: '请按以下要求处理术语：',
      termCollapse: '收起',
      settingsTitle: '设置',
      apiKeyLabel: 'Moonshot API Key',
      modelLabel: '模型',
      modelPlaceholder: '例如：kimi-k2.6',
      apiKeyHint: '仅保存在你的浏览器中，通过加密 HTTPS 发送。长按输入框可粘贴。',
      save: '保存',
      saved: '已保存',
      clear: '清除',
      cleared: '已清除',
      show: '显示',
      hide: '隐藏',
      errorNetworkTitle: '连接失败',
      errorNetworkMsg: '无法连接到服务器。',
      errorNetworkSuggest: '请检查网络后重试。',
      errorAuthTitle: 'API Key 无效',
      errorAuthMsg: '你的 API Key 被 Moonshot 拒绝。',
      errorAuthSuggest: '请在设置中检查你的 Key。',
      errorRateTitle: '请求过于频繁',
      errorRateMsg: '请求次数过多。',
      errorRateSuggest: '请稍等片刻后重试。',
      errorServerTitle: '服务器错误',
      errorServerMsg: 'Moonshot API 暂时不可用。',
      errorServerSuggest: '请稍后重试。',
      errorIncompleteTitle: '响应不完整',
      errorIncompleteMsg: '流式输出在结束前被关闭。',
      errorIncompleteSuggest: '点击重试重新生成。',
      errorParseTitle: '响应错误',
      errorParseMsg: '从服务器接收到异常数据。',
      errorParseSuggest: '请刷新页面后重试。',
      errorGenericTitle: '请求失败',
      errorGenericSuggest: '请重试。',
    },
    en: {
      translate: 'Translate',
      grammar: 'Expression Guide',
      tone: 'Tone',
      casual1: 'Casual I',
      casual2: 'Casual II',
      natural: 'Natural',
      formal1: 'Formal I',
      formal2: 'Formal II',
      targetLangLabel: 'Target language',
      targetLangPlaceholder: 'e.g. English, Japanese, French',
      defaultTargetLang: 'Chinese',
      toneInstructionsLabel: 'Instructions',
      moreLabel: 'More',
      morePlaceholder: 'e.g. Use inverted sentences, avoid the word "A", this is a character\'s spoken line...',
      moreCollapsedLabel: 'Add notes',
      textToTranslate: 'Enter text to translate',
      translateBtn: 'Translate',
      grammarPromptLabel: 'Expression goal',
      textToCheck: 'Enter text to polish',
      checkBtn: 'Guide',
      result: 'Result',
      polished: 'Polished',
      corrected: 'Corrected',
      changes: 'Changes',
      issues: 'Issues',
      copy: 'Copy',
      copied: 'Copied',
      retry: 'Retry',
      retryFeedbackPlaceholder: 'Tell the model how to adjust',
      retrySubmit: 'Regenerate',
      retryPlain: 'Retry',
      retryCancel: 'Cancel',
      loading: '',
      errorEmpty: 'Please enter some text',
      phPrompt: 'Edit additional style instructions here...',
      phText: 'Enter source text here...',
      phGrammarPrompt: 'Describe the expression effect you want. e.g. Focus on the academic tone, make the wording more literary, make it more like internet slang...',
      phGrammarText: 'Enter text to polish here...',
      checkGrammarOnly: 'Check grammar only',
      footerUsage: 'How to Use',
      footerTroubleshoot: 'Troubleshoot',
      footerUsageText: '- <strong>Translate:</strong> Enter text in any language and pick the target language<br>- <strong>Terminology:</strong> Expand to keep terms original or specify translations<br>- <strong>Tone:</strong> Choose from five styles (Casual I/II, Natural, Formal I/II)<br>- <strong>More:</strong> Add any extra instructions or context<br>- <strong>X-Vibe:</strong> On Casual II, click X-Vibe for Grok-style translation<br>- <strong>Expression Guide:</strong> Enter text, describe the expression style you want, or click "Check grammar only" for grammar-only checking<br>- <strong>API Key:</strong> Click the settings button at the top to use your own Moonshot key<br>- <strong>Retry & History:</strong> Click Retry to give feedback and regenerate, or use arrows to browse history<br>- <strong>Tip:</strong> Press Ctrl+Enter to submit',
      footerTroubleshootText: '<strong>Incomplete output?</strong> This is streaming output; Kimi is still reasoning. Please wait.<br><strong>Slow response?</strong> Kimi API inference takes time. This is normal.<br><strong>Poor translation quality?</strong> Try adjusting target language or tone, or add notes in "More".<br><strong>No changes after polishing?</strong> The original text may already be correct, or try describing a different expression goal.<br><strong>API Key privacy?</strong> Your key is saved in your browser only. It passes through this Cloudflare Worker via encrypted HTTPS and is never stored or logged.<br><strong>Error codes:</strong> 401/403 = invalid key; 429 = rate limited; 502/503 = Moonshot server issue; Network error = check your connection.',
      footerCredits: 'Credits',
      footerCreditsText: '<a href="https://www.moonshot.cn" target="_blank">Moonshot AI (Kimi K2.6)</a> — Translation & expression engine<br><a href="https://chatgpt.com/" target="_blank">GPT-5.5 / GPT-5.6 Luna</a> — System prompt & design philosophy<br>User — Design philosophy & UI design',
      grokCredit: '<a href="https://x.ai/" target="_blank">xAI (Grok)</a> — Translation engine',
      clear: 'Clear',
      reset: 'Reset',
      expand: 'Expand',
      collapse: 'Collapse',
      xVibe: 'want that X vibe?',
      xVibeActive: 'Grok it!',
      term: 'Glossary',
      termToggleAdd: 'Add terms',
      termTable: 'Glossary',
      termAdd: 'Add',
      termClear: 'Clear',
      termEmpty: 'No terms added',
      termKeep: 'Keep original',
      termTranslate: 'Translate',
      termInputPh: 'Enter term...',
      termTranslationPh: 'specify translation',
      termGuidancePrefix: 'Please handle the following terms according to these guidelines:',
      termCollapse: 'Collapse',
      settingsTitle: 'Settings',
      apiKeyLabel: 'Moonshot API Key',
      modelLabel: 'Model',
      modelPlaceholder: 'e.g. kimi-k2.6',
      apiKeyHint: 'Stored only in your browser. Sent securely via HTTPS. Long-press the input to paste.',
      save: 'Save',
      saved: 'Saved',
      clear: 'Clear',
      cleared: 'Cleared',
      show: 'Show',
      hide: 'Hide',
      errorNetworkTitle: 'Connection Failed',
      errorNetworkMsg: 'Unable to reach the server.',
      errorNetworkSuggest: 'Check your network and retry.',
      errorAuthTitle: 'API Key Invalid',
      errorAuthMsg: 'Your API key was rejected by Moonshot.',
      errorAuthSuggest: 'Verify your key in Settings.',
      errorRateTitle: 'Rate Limited',
      errorRateMsg: 'Too many requests.',
      errorRateSuggest: 'Wait a moment and retry.',
      errorServerTitle: 'Server Error',
      errorServerMsg: 'Moonshot API is temporarily unavailable.',
      errorServerSuggest: 'Retry later.',
      errorIncompleteTitle: 'Incomplete Response',
      errorIncompleteMsg: 'The stream closed before completion.',
      errorIncompleteSuggest: 'Click Retry to regenerate.',
      errorParseTitle: 'Response Error',
      errorParseMsg: 'Received malformed data from server.',
      errorParseSuggest: 'Refresh the page and try again.',
      errorGenericTitle: 'Request Failed',
      errorGenericSuggest: 'Please retry.',
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
    toggleMoreExpand: toggleMoreExpand,
    toggleXvibe: toggleXvibe,
    resetXvibe: resetXvibe,
    setLoading: setLoading,
    hideResult: hideResult,
    showResult: showResult,
    renderResult: renderResult,
    copyResult: copyResult,
    sendRequest: sendRequest,
    sendRetryRequest: sendRetryRequest,
    sendTranslate: sendTranslate,
    sendGrammar: sendGrammar,
    toggleTheme: toggleTheme,
    showRetryUI: showRetryUI,
    hideRetryUI: hideRetryUI,
    submitRetry: submitRetry,
    plainRetry: plainRetry,
    cancelRetry: cancelRetry,
    defaultPrompts: defaultPrompts,
    grammarOnlyPrompt: grammarOnlyPrompt,
    i18n: i18n,
    $: $,
    toggleTermExpand: toggleTermExpand,
    addTerm: addTerm,
    removeTerm: removeTerm,
    setTermMode: setTermMode,
    setTermTranslation: setTermTranslation,
    clearTerms: clearTerms,
    generateTermGuidance: generateTermGuidance,
    isTermExpanded: function() { return isTermExpanded; },
    retry: retry,
    historyPrev: historyPrev,
    historyNext: historyNext,
    toggleSettings: toggleSettings,
    saveApiKey: saveApiKey,
    clearApiKey: clearApiKey,
    toggleKeyVisibility: toggleKeyVisibility,
    showModal: showModal,
    hideModal: hideModal,
  };

  // ===== Modal =====
  function showModal(message) {
    $("modal-message").textContent = message;
    $("modal-overlay").classList.add("show");
  }

  function hideModal() {
    $("modal-overlay").classList.remove("show");
  }

  // ===== Settings =====
  function toggleSettings() {
    isSettingsOpen = !isSettingsOpen;
    $("settings-panel").style.display = isSettingsOpen ? '' : 'none';
    if (isSettingsOpen) {
      const savedKey = localStorage.getItem('moonshot_api_key');
      const keyInput = $("api-key-input");
      if (savedKey) {
        keyInput.value = savedKey;
        keyInput.type = 'password';
        $("btn-toggle-key").textContent = i18n[currentLang].show;
      } else {
        keyInput.value = '';
      }
      const savedModel = localStorage.getItem('moonshot_model');
      $("model-input").value = savedModel || '';
    }
  }

  function saveApiKey() {
    const key = $("api-key-input").value.trim();
    const model = $("model-input").value.trim();
    if (key || model) {
      const t = i18n[currentLang];
      if (key) {
        localStorage.setItem('moonshot_api_key', key);
        $("api-key-input").type = 'password';
        $("btn-toggle-key").textContent = t.show;
      }
      if (model) {
        localStorage.setItem('moonshot_model', model);
      } else {
        localStorage.removeItem('moonshot_model');
      }
      showModal(t.saved);
    }
  }

  function clearApiKey() {
    localStorage.removeItem('moonshot_api_key');
    localStorage.removeItem('moonshot_model');
    $("api-key-input").value = '';
    $("model-input").value = '';
    const t = i18n[currentLang];
    showModal(t.cleared);
  }

  function toggleKeyVisibility() {
    const input = $("api-key-input");
    const btn = $("btn-toggle-key");
    const t = i18n[currentLang];
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = t.hide;
    } else {
      input.type = 'password';
      btn.textContent = t.show;
    }
  }

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

  function toggleMoreExpand() {
    isMoreExpanded = !isMoreExpanded;
    $("more-collapsed").style.display = isMoreExpanded ? 'none' : '';
    $("more-expanded").style.display = isMoreExpanded ? '' : 'none';
  }

  function updateMoreCollapsedLabel() {
    const link = $("more-toggle-link");
    if (!link) return;
    const t = i18n[currentLang];
    const hasContent = $("more-input") && $("more-input").value.trim();
    if (isMoreExpanded) return;
    link.textContent = hasContent ? t.moreLabel : t.moreCollapsedLabel;
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
    const retryBtn = $("btn-retry");
    if (retryBtn) retryBtn.textContent = t.retry;
    const retryInput = $("retry-input");
    if (retryInput) retryInput.placeholder = t.retryFeedbackPlaceholder || '';
    const retrySubmit = $("btn-retry-submit");
    if (retrySubmit) retrySubmit.textContent = t.retrySubmit || 'Regenerate';
    const retryPlain = $("btn-retry-plain");
    if (retryPlain) retryPlain.textContent = t.retryPlain || 'Retry';
    const retryCancel = $("btn-retry-cancel");
    if (retryCancel) retryCancel.textContent = t.retryCancel || 'Cancel';
    $("loading-text").textContent = t.loading;

    // Target language
    $("label-target-lang").textContent = t.targetLangLabel;
    $("target-lang").placeholder = t.targetLangPlaceholder;
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

    // More
    $("label-more").textContent = t.moreLabel;
    $("more-input").placeholder = t.morePlaceholder;
    updateMoreCollapsedLabel();

    // Source text
    $("label-source").textContent = t.textToTranslate;

    // Grammar labels
    $("label-grammar-prompt").textContent = t.grammarPromptLabel;
    $("label-grammar-text").textContent = t.textToCheck;
    $("btn-check").textContent = t.checkBtn;
    const grammarOnlyBtn = $("btn-grammar-only");
    if (grammarOnlyBtn) grammarOnlyBtn.textContent = t.checkGrammarOnly;

    $("result-box").querySelector(".result-title").textContent = t.result;

    const resultBody = $("result-body");
    if (resultBody) {
      resultBody.querySelectorAll('.grammar-section').forEach(function(section) {
        const titleEl = section.querySelector('.grammar-section-title');
        if (!titleEl) return;
        const sectionType = section.getAttribute('data-section');
        if (sectionType === 'polished') titleEl.textContent = t.polished;
        else if (sectionType === 'corrected') titleEl.textContent = t.corrected;
        else if (sectionType === 'changes') titleEl.textContent = t.changes;
        else if (sectionType === 'issues') titleEl.textContent = t.issues;
      });
    }

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

    // Terminology
    const termPrefix = $("label-term-prefix");
    if (termPrefix) termPrefix.textContent = t.term;
    const termToggle = $("term-toggle-link");
    if (termToggle) termToggle.textContent = t.termToggleAdd;
    const termTableLabel = $("label-term-table");
    if (termTableLabel) termTableLabel.textContent = t.termTable;
    const termInput = $("term-input");
    if (termInput) termInput.placeholder = t.termInputPh || '';
    const addTermBtn = $("btn-add-term");
    if (addTermBtn) addTermBtn.textContent = t.termAdd;
    const clearTermBtn = $("btn-clear-terms");
    if (clearTermBtn) clearTermBtn.textContent = t.termClear;
    const termCollapse = $("term-collapse-link");
    if (termCollapse) termCollapse.textContent = t.termCollapse;
    renderTermList();

    // Settings
    const settingsTitle = $("settings-title");
    if (settingsTitle) settingsTitle.textContent = t.settingsTitle;
    const labelApiKey = $("label-api-key");
    if (labelApiKey) labelApiKey.textContent = t.apiKeyLabel;
    const labelModel = $("label-model");
    if (labelModel) labelModel.textContent = t.modelLabel;
    const modelInput = $("model-input");
    if (modelInput) modelInput.placeholder = t.modelPlaceholder;
    const settingsHint = $("settings-hint");
    if (settingsHint) settingsHint.textContent = t.apiKeyHint;
    const saveBtn = $("btn-save-key");
    if (saveBtn) saveBtn.textContent = t.save;
    const clearBtn = $("btn-clear-key");
    if (clearBtn) clearBtn.textContent = t.clear;
    const toggleBtn = $("btn-toggle-key");
    if (toggleBtn) {
      const input = $("api-key-input");
      toggleBtn.textContent = input && input.type === 'password' ? t.show : t.hide;
    }

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

  function renderResult(text, mode) {
    const body = $("result-body");
    const t = i18n[currentLang];
    if (mode === 'grammar') {
      const isExpressionGuide = text.indexOf('Polished:') !== -1;
      const firstKey = isExpressionGuide ? 'Polished:' : 'Corrected:';
      const secondKey = isExpressionGuide ? 'Changes:' : 'Issues:';
      const firstTitle = isExpressionGuide ? t.polished : t.corrected;
      const secondTitle = isExpressionGuide ? t.changes : t.issues;
      let firstText = '';
      let secondText = '';
      const firstIdx = text.indexOf(firstKey);
      const secondIdx = text.indexOf(secondKey);
      if (firstIdx !== -1) {
        if (secondIdx !== -1 && secondIdx > firstIdx) {
          firstText = text.substring(firstIdx + firstKey.length, secondIdx).trim();
          secondText = text.substring(secondIdx + secondKey.length).trim();
        } else {
          firstText = text.substring(firstIdx + firstKey.length).trim();
        }
      } else {
        firstText = text.trim();
      }
      if (!secondText || secondText.toLowerCase().indexOf('none') >= 0) {
        secondText = 'none';
        firstText = '✔';
      } else if (!firstText) {
        firstText = '✔';
      }
      const firstSection = isExpressionGuide ? 'polished' : 'corrected';
      const secondSection = isExpressionGuide ? 'changes' : 'issues';
      let html = '<div class="grammar-section" data-section="' + firstSection + '"><div class="grammar-section-title">' + escapeHtml(firstTitle) + '</div><div class="grammar-corrected">' + escapeHtml(firstText) + '</div></div>';
      html += '<div class="grammar-section" data-section="' + secondSection + '"><div class="grammar-section-title">' + escapeHtml(secondTitle) + '</div><div class="grammar-issues">' + formatIssues(secondText) + '</div></div>';
      body.innerHTML = html;
    } else {
      const html = escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      body.innerHTML = html;
    }
    $("result-box").classList.add("show");
  }

  function showResult(text, mode) {
    renderResult(text, mode);
    addHistory(text, mode);
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

  let lastRequest = null;

  function buildErrorModal(type, detail) {
    const t = i18n[currentLang];
    const map = {
      'network': { title: t.errorNetworkTitle, msg: t.errorNetworkMsg, suggest: t.errorNetworkSuggest },
      'auth': { title: t.errorAuthTitle, msg: t.errorAuthMsg, suggest: t.errorAuthSuggest },
      'rate_limit': { title: t.errorRateTitle, msg: t.errorRateMsg, suggest: t.errorRateSuggest },
      'server': { title: t.errorServerTitle, msg: t.errorServerMsg, suggest: t.errorServerSuggest },
      'incomplete': { title: t.errorIncompleteTitle, msg: t.errorIncompleteMsg, suggest: t.errorIncompleteSuggest },
      'parse': { title: t.errorParseTitle, msg: t.errorParseMsg, suggest: t.errorParseSuggest },
      'generic': { title: t.errorGenericTitle, msg: detail || 'An unknown error occurred.', suggest: t.errorGenericSuggest }
    };
    const info = map[type] || map['generic'];
    return info.title + '\n\n' + info.msg + '\n' + info.suggest;
  }

  async function sendRequest(mode, text, customPrompt, targetLang, grammarMode) {
    lastRequest = { mode: mode, text: text, customPrompt: customPrompt, targetLang: targetLang, grammarMode: grammarMode };
    const parts = [];
    if (targetLang) parts.push('Translate to ' + targetLang + '.');
    if (customPrompt) parts.push(customPrompt);
    const combinedPrompt = parts.join(' ');
    const provider = (mode === 'translate' && isXvibe) ? 'grok' : 'kimi';
    await doRequest(mode, text, combinedPrompt, provider, undefined, undefined, grammarMode);
  }

  async function sendRetryRequest(feedback, previousOutput) {
    if (!lastRequest) return;
    const parts = [];
    if (lastRequest.targetLang) parts.push('Translate to ' + lastRequest.targetLang + '.');
    if (lastRequest.customPrompt) parts.push(lastRequest.customPrompt);
    const combinedPrompt = parts.join(' ');
    const provider = (lastRequest.mode === 'translate' && isXvibe) ? 'grok' : 'kimi';
    await doRequest(lastRequest.mode, lastRequest.text, combinedPrompt, provider, feedback, previousOutput, lastRequest.grammarMode);
  }

  async function doRequest(mode, text, combinedPrompt, provider, feedback, previousOutput, grammarMode) {
    setLoading(true);
    hideResult();
    try {
      const payload = { mode: mode, text: text, customPrompt: combinedPrompt, provider: provider };
      if (grammarMode) payload.grammarMode = grammarMode;
      if (provider !== 'grok') {
        const userKey = localStorage.getItem('moonshot_api_key');
        const userModel = localStorage.getItem('moonshot_model');
        if (userKey) payload.userApiKey = userKey;
        if (userModel) payload.userModel = userModel;
      }
      if (feedback !== undefined && feedback !== null) {
        payload.feedback = feedback;
        payload.previousOutput = previousOutput;
      }
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(function() { return {}; });
        throw { httpStatus: res.status, detail: errData.detail || errData.error || ("HTTP " + res.status) };
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
            if (json.error) throw { apiError: true, message: json.error.message || "API Error" };
            const content = (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) || "";
            if (content) {
              fullText += content;
              resultBody.textContent = fullText;
            }
          } catch (e) {
            if (e.apiError) throw e;
          }
        }
      }
      if (fullText) {
        renderResult(fullText, mode);
        addHistory(fullText, mode);
      } else {
        hideResult();
      }
    } catch (e) {
      let errorType = 'generic';
      if (e.httpStatus) {
        if (e.httpStatus === 401 || e.httpStatus === 403) errorType = 'auth';
        else if (e.httpStatus === 429) errorType = 'rate_limit';
        else if (e.httpStatus >= 500) errorType = 'server';
        showModal(buildErrorModal(errorType, e.detail));
      } else if (e.message) {
        const msg = e.message.toLowerCase();
        if (msg.indexOf('failed to fetch') >= 0 || msg.indexOf('network') >= 0) {
          errorType = 'network';
        } else if (msg.indexOf('api') >= 0 && msg.indexOf('error') >= 0) {
          errorType = 'parse';
        }
        showModal(buildErrorModal(errorType, e.message));
      } else {
        showModal(buildErrorModal('generic', 'An unknown error occurred.'));
      }
      hideResult();
    } finally {
      setLoading(false);
    }
  }

  function sendTranslate() {
    const text = $("translate-input").value.trim();
    if (!text) { showModal(i18n[currentLang].errorEmpty); return; }
    prompts[currentTone] = $("tone-prompt").value;
    const tonePrompt = $("tone-prompt").value.trim();
    const moreText = $("more-input").value.trim();
    const targetLang = $("target-lang").value.trim();

    const termGuidance = generateTermGuidance();
    let finalPrompt = tonePrompt;
    if (moreText) finalPrompt += '\n\n' + moreText;
    if (termGuidance) finalPrompt += '\n\n' + termGuidance;

    sendRequest("translate", text, finalPrompt, targetLang);
  }

  function sendGrammar() {
    const text = $("grammar-input").value.trim();
    if (!text) { showModal(i18n[currentLang].errorEmpty); return; }
    grammarPrompt = $("grammar-prompt").value;
    const customPrompt = $("grammar-prompt").value.trim();
    const grammarMode = (customPrompt === grammarOnlyPrompt) ? 'grammar-only' : 'expression-guide';
    sendRequest("grammar", text, customPrompt, null, grammarMode);
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

  function toggleTermExpand() {
    isTermExpanded = !isTermExpanded;
    $("term-collapsed").style.display = isTermExpanded ? 'none' : '';
    $("term-expanded").style.display = isTermExpanded ? '' : 'none';
  }

  function renderTermList() {
    const list = $("term-list");
    if (!list) return;
    if (technicalTerms.length === 0) {
      list.innerHTML = '<div class="term-empty">' + (i18n[currentLang].termEmpty || 'No terms added') + '</div>';
      return;
    }
    let html = '';
    technicalTerms.forEach(function(item, idx) {
      const keepChecked = item.mode === 'keep' ? 'checked' : '';
      const transChecked = item.mode === 'translate' ? 'checked' : '';
      const transDisplay = item.mode === 'translate' ? '' : 'display:none;';
      html += '<div class="term-item" data-index="' + idx + '">' +
        '<div class="term-row">' +
          '<span class="term-text">' + escapeHtml(item.term) + '</span>' +
          '<div class="term-modes">' +
            '<label class="term-mode' + (item.mode === 'keep' ? ' active' : '') + '">' +
              '<input type="radio" name="term-mode-' + idx + '" value="keep" ' + keepChecked + ' onchange="window.TranslatorI18n.setTermMode(' + idx + ', \'keep\')">' +
              '<span>' + (i18n[currentLang].termKeep || '保留原文') + '</span>' +
            '</label>' +
            '<label class="term-mode' + (item.mode === 'translate' ? ' active' : '') + '">' +
              '<input type="radio" name="term-mode-' + idx + '" value="translate" ' + transChecked + ' onchange="window.TranslatorI18n.setTermMode(' + idx + ', \'translate\')">' +
              '<span>' + (i18n[currentLang].termTranslate || '翻译') + '</span>' +
            '</label>' +
          '</div>' +
          '<button class="term-delete" onclick="window.TranslatorI18n.removeTerm(' + idx + ')">×</button>' +
        '</div>' +
        '<input type="text" class="term-translation" placeholder="' + (i18n[currentLang].termTranslationPh || '可选：指定译法') + '" value="' + escapeHtml(item.translation || '') + '" style="' + transDisplay + '" oninput="window.TranslatorI18n.setTermTranslation(' + idx + ', this.value)">' +
      '</div>';
    });
    list.innerHTML = html;
  }

  function addTerm(term) {
    term = term.trim();
    if (!term) return;
    if (technicalTerms.some(function(t) { return t.term === term; })) return;
    technicalTerms.push({ term: term, mode: 'keep', translation: '' });
    renderTermList();
    $("term-input").value = "";
  }

  function removeTerm(index) {
    technicalTerms.splice(index, 1);
    renderTermList();
  }

  function setTermMode(index, mode) {
    if (technicalTerms[index]) {
      technicalTerms[index].mode = mode;
      renderTermList();
    }
  }

  function setTermTranslation(index, translation) {
    if (technicalTerms[index]) {
      technicalTerms[index].translation = translation;
    }
  }

  function clearTerms() {
    technicalTerms = [];
    renderTermList();
  }

  function generateTermGuidance() {
    if (technicalTerms.length === 0) return '';
    const t = i18n[currentLang];
    let lines = [];
    lines.push(t.termGuidancePrefix || 'Please handle the following terms according to these guidelines:');
    technicalTerms.forEach(function(item) {
      if (item.mode === 'keep') {
        lines.push('- "' + item.term + '": keep in original language, do not translate.');
      } else {
        if (item.translation && item.translation.trim()) {
          lines.push('- "' + item.term + '": translate as "' + item.translation.trim() + '".');
        } else {
          lines.push('- "' + item.term + '": translate into the target language.');
        }
      }
    });
    return lines.join('\n');
  }

  // History functions
  function addHistory(text, mode) {
    history.push({ text: text, mode: mode, timestamp: Date.now() });
    if (history.length > MAX_HISTORY) {
      history.shift();
    }
    historyIndex = history.length - 1;
    updateHistoryNav();
  }

  function updateHistoryNav() {
    const nav = $("history-nav");
    const page = $("history-page");
    if (!nav || !page) return;
    if (history.length <= 1) {
      nav.style.display = 'none';
      return;
    }
    nav.style.display = 'flex';
    page.textContent = (historyIndex + 1) + '/' + history.length;
  }

  function showHistory(index) {
    if (index < 0 || index >= history.length) return;
    historyIndex = index;
    const item = history[index];
    renderResult(item.text, item.mode);
    updateHistoryNav();
  }

  function historyPrev() {
    if (historyIndex > 0) {
      showHistory(historyIndex - 1);
    }
  }

  function historyNext() {
    if (historyIndex < history.length - 1) {
      showHistory(historyIndex + 1);
    }
  }

  function retry() {
    showRetryUI();
  }

  function showRetryUI() {
    const el = $("retry-feedback");
    if (!el) return;
    el.style.display = '';
    $("retry-input").focus();
  }

  function hideRetryUI() {
    const el = $("retry-feedback");
    if (!el) return;
    el.style.display = 'none';
    $("retry-input").value = '';
  }

  function submitRetry() {
    const feedback = $("retry-input").value.trim();
    if (!feedback) {
      plainRetry();
      return;
    }
    const previousOutput = history[historyIndex] ? history[historyIndex].text : '';
    if (!previousOutput) {
      plainRetry();
      return;
    }
    hideRetryUI();
    sendRetryRequest(feedback, previousOutput);
  }

  function plainRetry() {
    hideRetryUI();
    if (!lastRequest) {
      if (currentMode === 'translate') {
        sendTranslate();
      } else {
        sendGrammar();
      }
      return;
    }
    sendRequest(lastRequest.mode, lastRequest.text, lastRequest.customPrompt, lastRequest.targetLang);
  }

  function cancelRetry() {
    hideRetryUI();
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
    renderTermList();
  });
})();