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

  const historyByMode = {
    translate: { rows: [], index: -1, version: 0 },
    grammar: { rows: [], index: -1, version: 0 }
  };
  let undoSnapshot = null;
  let undoTimer = null;
  let currentRequestMode = 'translate';
  let isSettingsOpen = false;
  let customPromptLists = { tone: [], more: [], grammar: [] };
  const defaultRequestOptions = {
    translate: { count: 1, requests: [{ model: 'kimi', resultMode: 'single', reasons: false, unrestricted: false }, { model: 'kimi', resultMode: 'single', reasons: false, unrestricted: false }] },
    grammar: { count: 1, requests: [{ model: 'kimi', resultMode: 'single', reasons: true, unrestricted: false }, { model: 'kimi', resultMode: 'single', reasons: true, unrestricted: false }] }
  };
  let requestOptions = JSON.parse(JSON.stringify(defaultRequestOptions));
  let activeRequestConfig = null;
  let loadingTimer = null;
  let loadingTipIndex = 0;
  let loadingOperations = 0;
  const loadingTips = ['test1', 'test2', 'test3'];
  const supportedModels = [
    { value: 'luna', label: 'GPT-5.6 Luna' },
    { value: 'kimi', label: 'K2.6' },
    { value: 'anthropic', label: 'Claude Haiku 5.5' },
    { value: 'grok', label: 'Grok 4.3 (X-Vibe)' }
  ];

  const modelProviders = {
    luna: { provider: 'openai', model: 'gpt-5.6-luna' },
    kimi: { provider: 'kimi', model: 'kimi-k2.6' },
    anthropic: { provider: 'anthropic', model: 'claude-haiku-5-5' },
    grok: { provider: 'grok', model: 'grok-4.3' }
  };

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
      footerUsageText: '- <strong>翻译：</strong>输入文本并选择目标语言；点齿轮设置一或两项并行请求、模型、结果格式及提示选项<br>- <strong>语气/补充/表达目标：</strong>可用 + 保存自定义提示词并从列表套用<br>- <strong>术语表：</strong>展开添加需固定译法或保留原文的术语<br>- <strong>X-Vibe：</strong>在"随意 II"下点 X-Vibe 使用当前 Grok 路由<br>- <strong>历史：</strong>翻译与表达指导分别保存；同一输入的重试作为新版本保留，可删除或清空并在 5 秒内撤销<br>- <strong>模型：</strong>仅当前支持的 Kimi/Grok 路由可用；其他提供商暂不可用<br>- <strong>API Key：</strong>点击顶部设置按钮填入你自己的 Moonshot Key<br>- <strong>快捷键：</strong>Ctrl+Enter 快捷提交',
      optionsTitle: '请求选项',
      optionsCount: '请求数',
      optionsRequest: '请求',
      optionsModel: '模型',
      optionsResult: '结果格式',
      optionsReasons: '提供理由',
      optionsUnrestricted: 'Unrestricted(Beta)',
      optionsSingle: '单项结果',
      optionsMultiple: '多个结果',
      optionsHelp: '每个请求都可以独立选择模型、结果格式和理由。选择两个请求会并行生成两张结果卡片；Unrestricted(Beta) 只会关闭当前请求的结果格式与理由设置。所有更改会立即保存。',
      optionsUnavailable: '此提供商暂不可用',
      apiKeyOpenAI: 'OpenAI API Key',
      apiKeyAnthropic: 'Anthropic API Key',
      historyLabel: '历史记录',
      historyClearAll: '全部清除',
      historyUndo: '撤销',
      savedPrompts: '已保存的提示词',
      optionsUnavailable: '此模型暂不可用。',
      footerTroubleshootText: '<strong>输出不完整？</strong>这是流式输出，Kimi 仍在推理中，请稍等。<br><strong>响应慢？</strong>Kimi API 推理时间较长，属正常现象。<br><strong>翻译质量不佳？</strong>尝试调整目标语言或语气，或在"补充"中添加说明。<br><strong>润色后无修改？</strong>说明原文已很通顺，或尝试在"表达效果"中指定调整方向。<br><strong>API Key 隐私？</strong>你的 Key 仅保存在浏览器本地，通过加密 HTTPS 经 Cloudflare Worker 转发至 Moonshot，服务端不存储、不记录。<br><strong>错误代码说明：</strong>401/403 = Key 无效；429 = 请求过于频繁；502/503 = Moonshot 服务端异常；网络错误 = 请检查本地网络。',
      footerCredits: '鸣谢',
      footerCreditsText: 'Translation & expression engine — Kimi K2.6 / GPT-5.6 Luna / Claude Haiku 5.5<br>System prompt & design philosophy — GPT-5.5 / GPT-5.6 Luna<br>Beta Tester & Feedback — <a href="https://x.com/shu_gan95136" target="_blank">MtPMTea</a><br>System prompt & Design philosophy & UI design — <a href="#personal-credit" data-personal-credit="true">Totsbi</a>',
      confirmRestore: 'Restore this history item and replace the current input?',
      yes: 'Yes',
      no: 'No',
      personalCreditTitle: 'Personal credit',
      guideContinue: 'continue',
      guideSend: 'Send',
      guideContinuePlaceholder: 'Continue the conversation...',
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
      footerUsageText: '- <strong>Translate:</strong> Enter text and choose a target language; use the gear for one or two concurrent requests, models, result format, and prompt options<br>- <strong>Tone, More, and Expression goal:</strong> Use + to save custom prompts and select them later<br>- <strong>Terminology:</strong> Expand to keep terms original or specify translations<br>- <strong>X-Vibe:</strong> On Casual II, click X-Vibe to use the existing Grok route<br>- <strong>History:</strong> Translator and Expression Guide histories are separate; retries of the same input become versions. Delete or clear entries and undo within five seconds<br>- <strong>Models:</strong> Only the current Kimi/Grok routes are available; other providers are marked unavailable<br>- <strong>API Key:</strong> Click the settings button at the top to use your own Moonshot key<br>- <strong>Tip:</strong> Press Ctrl+Enter to submit',
      optionsTitle: 'Request options',
      optionsCount: 'Requests',
      optionsRequest: 'Request',
      optionsModel: 'Model',
      optionsResult: 'Result format',
      optionsReasons: 'Include reasons',
      optionsUnrestricted: 'Unrestricted(Beta)',
      optionsSingle: 'A single result',
      optionsMultiple: 'Multiple results',
      optionsHelp: 'Each request is independent: choose its model, result format, and reasons. Two requests run concurrently and render separate cards. Unrestricted(Beta) disables only the current request’s result-format and reasons controls. Changes save immediately.',
      optionsUnavailable: 'Provider unavailable',
      apiKeyOpenAI: 'OpenAI API Key',
      apiKeyAnthropic: 'Anthropic API Key',
      historyLabel: 'History',
      historyClearAll: 'Clear all',
      historyUndo: 'Undo',
      savedPrompts: 'Saved prompts',
      optionsUnavailable: 'This model is not available yet.',
      footerTroubleshootText: '<strong>Incomplete output?</strong> This is streaming output; Kimi is still reasoning. Please wait.<br><strong>Slow response?</strong> Kimi API inference takes time. This is normal.<br><strong>Poor translation quality?</strong> Try adjusting target language or tone, or add notes in "More".<br><strong>No changes after polishing?</strong> The original text may already be correct, or try describing a different expression goal.<br><strong>API Key privacy?</strong> Your key is saved in your browser only. It passes through this Cloudflare Worker via encrypted HTTPS and is never stored or logged.<br><strong>Error codes:</strong> 401/403 = invalid key; 429 = rate limited; 502/503 = Moonshot server issue; Network error = check your connection.',
      footerCredits: 'Credits',
      footerCreditsText: 'Translation & expression engine — Kimi K2.6 / GPT-5.6 Luna / Claude Haiku 5.5<br>System prompt & design philosophy — GPT-5.5 / GPT-5.6 Luna<br>Beta Tester & Feedback — <a href="https://x.com/shu_gan95136" target="_blank">MtPMTea</a><br>System prompt & Design philosophy & UI design — <a href="#personal-credit" data-personal-credit="true">Totsbi</a>',
      confirmRestore: 'Restore this history item and replace the current input?',
      yes: 'Yes',
      no: 'No',
      personalCreditTitle: 'Personal credit',
      guideContinue: 'continue',
      guideSend: 'Send',
      guideContinuePlaceholder: 'Continue the conversation...',
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
    sendRequest: sendRequest,
    sendTranslate: sendTranslate,
    sendGrammar: sendGrammar,
    toggleTheme: toggleTheme,
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
    historyPrev: historyPrev,
    historyNext: historyNext,
    toggleSettings: toggleSettings,
    saveApiKey: saveApiKey,
    clearApiKey: clearApiKey,
    toggleKeyVisibility: toggleKeyVisibility,
    showModal: showModal,
    hideModal: hideModal,
    resolveModalNo: resolveModalNo,
    resolveModalYes: resolveModalYes,
    showTutorial: showTutorial,
    hidePersonalCredit: hidePersonalCredit,
    hideTutorial: hideTutorial,
    toggleRequestOptions: toggleRequestOptions,
    closeRequestOptions: closeRequestOptions,
    saveRequestOptions: saveRequestOptions,
    updateRequestOptionsUI: updateRequestOptionsUI,
    setRequestCount: setRequestCount,
    handleRequestOptionChange: handleRequestOptionChange,
    showRequestOptionsHelp: showRequestOptionsHelp,
    saveCustomPrompt: saveCustomPrompt,
    applyCustomPrompt: applyCustomPrompt,
    handleResultAction: handleResultAction,
    handleHistoryAction: handleHistoryAction,
    clearHistory: clearHistory,
    undoHistory: undoHistory,
  };

  // ===== Modal =====
  let modalResolver = null;
  function showModal(message, confirm) {
    $("modal-message").textContent = message;
    $('modal-no').hidden = !confirm;
    $('modal-yes').hidden = !confirm;
    $('modal-ok').hidden = !!confirm;
    if (confirm) {
      $('modal-no').textContent = i18n[currentLang].no;
      $('modal-yes').textContent = i18n[currentLang].yes;
    }
    $('modal-overlay').classList.add('show');
  }

  function hideModal() {
    $('modal-overlay').classList.remove('show');
    if (modalResolver) { const resolve = modalResolver; modalResolver = null; resolve(false); }
  }

  function resolveModalNo() { hideModal(); }
  function resolveModalYes() {
    $('modal-overlay').classList.remove('show');
    if (modalResolver) { const resolve = modalResolver; modalResolver = null; resolve(true); }
  }
  function confirmModal(message) {
    return new Promise(function(resolve) { modalResolver = resolve; showModal(message, true); });
  }

  function showTutorial() {
    $('tutorial-title').textContent = i18n[currentLang].footerUsage;
    $('tutorial-content').innerHTML = i18n[currentLang].footerUsageText;
    $('tutorial-overlay').classList.add('show');
  }

  function hideTutorial() {
    $('tutorial-overlay').classList.remove('show');
  }

  function hidePersonalCredit() {
    $('personal-credit-overlay').classList.remove('show');
  }

  function loadLocalData() {
    try {
      const storedHistory = JSON.parse(localStorage.getItem('translator_histories') || '{}');
      ['translate', 'grammar'].forEach(function(mode) {
        if (storedHistory[mode] && Array.isArray(storedHistory[mode].rows)) historyByMode[mode].rows = storedHistory[mode].rows;
      });
      const savedOptions = JSON.parse(localStorage.getItem('translator_request_options') || 'null');
      if (savedOptions) {
        ['translate', 'grammar'].forEach(function(mode) {
          const config = savedOptions[mode] || (mode === 'translate' && !savedOptions.translate && !savedOptions.grammar ? savedOptions : null);
          if (!config) return;
          const fallback = defaultRequestOptions[mode].requests;
          let requests = Array.isArray(config.requests) ? config.requests : null;
          if (!requests) {
            const models = Array.isArray(config.models) ? config.models : [config.model || 'kimi', 'kimi'];
            requests = models.slice(0, 2).map(function(model, index) {
              return { model: model, resultMode: config.resultMode || 'single', reasons: config.reasons !== undefined ? !!config.reasons : fallback[index].reasons, unrestricted: !!config.unrestricted };
            });
          }
          requestOptions[mode] = { count: config.count === 2 ? 2 : 1, requests: [0, 1].map(function(index) { return Object.assign({}, fallback[index], requests[index] || {}); }) };
        });
      }
      const savedPrompts = JSON.parse(localStorage.getItem('translator_custom_prompts') || 'null');
      if (savedPrompts) customPromptLists = Object.assign(customPromptLists, savedPrompts);
    } catch (error) {}
  }

  function storeLocalData(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (error) { return false; }
  }

  function persistRequestOptions() { storeLocalData('translator_request_options', requestOptions); }

  function toggleRequestOptions(mode, anchor) {
    currentRequestMode = mode || currentMode;
    const panel = $('request-options');
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      renderRequestOptions();
      positionRequestOptions(anchor || document.querySelector('.request-settings-btn'));
    }
  }

  function positionRequestOptions(anchor) {
    const panel = $('request-options');
    if (!anchor || panel.hidden) return;
    panel.style.top = '0px';
    panel.style.left = '0px';
    panel.style.transform = 'none';
    const rect = anchor.getBoundingClientRect();
    const margin = 12;
    const gap = 8;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
    const left = Math.max(margin, Math.min(rect.right - width, viewportWidth - width - margin));
    const above = rect.top - gap - height;
    const top = above >= margin ? above : Math.min(rect.bottom + gap, viewportHeight - height - margin);
    panel.style.left = Math.max(margin, left) + 'px';
    panel.style.top = Math.max(margin, top) + 'px';
  }

  function closeRequestOptions() { $('request-options').hidden = true; }

  function renderRequestOptions() {
    const options = requestOptions[currentRequestMode];
    document.querySelectorAll('#request-count-segment button').forEach(function(button) { button.classList.toggle('active', Number(button.dataset.count) === options.count); });
    const t = i18n[currentLang];
    const blocks = $('request-blocks');
    blocks.innerHTML = options.requests.slice(0, options.count).map(function(request, index) {
      const unrestricted = !!request.unrestricted;
      return '<section class="request-block" data-request-index="' + index + '"><div class="request-block-title">' + escapeHtml(t.optionsRequest + ' ' + (index + 1)) + '</div><label><span>' + escapeHtml(t.optionsModel) + '</span><select class="model-choice" data-option="model">' + modelOptionsHtml(request.model) + '</select></label><div class="option-label">' + escapeHtml(t.optionsResult) + '</div><div class="segmented result-segment' + (unrestricted ? ' disabled' : '') + '" data-option="resultMode"><button type="button" data-value="single"' + (request.resultMode === 'single' ? ' class="active"' : '') + '>' + escapeHtml(t.optionsSingle) + '</button><button type="button" data-value="multiple"' + (request.resultMode === 'multiple' ? ' class="active"' : '') + '>' + escapeHtml(t.optionsMultiple) + '</button></div><label class="option-check"><input type="checkbox" data-option="reasons"' + (request.reasons ? ' checked' : '') + (unrestricted ? ' disabled' : '') + '><span>' + escapeHtml(t.optionsReasons) + '</span></label><label class="option-check"><input type="checkbox" data-option="unrestricted"' + (unrestricted ? ' checked' : '') + '><span>' + escapeHtml(t.optionsUnrestricted) + '</span></label></section>'; }).join('');
  }

  function modelOptionsHtml(selected) {
    return supportedModels.filter(function(model) { return model.value !== 'grok' || isXvibe; }).map(function(model) {
      return '<option value="' + model.value + '"' + (model.value === selected ? ' selected' : '') + '>' + escapeHtml(model.label) + '</option>';
    }).join('');
  }

  function setRequestCount(count) {
    requestOptions[currentRequestMode].count = count === 2 ? 2 : 1;
    persistRequestOptions();
    renderRequestOptions();
  }

  function updateRequestOptionsUI() { renderRequestOptions(); }

  function handleRequestOptionChange(event) {
    const control = event.target;
    if (event.type === 'click' && !control.matches('.segmented button[data-value]')) return;
    const block = control.closest('.request-block');
    if (!block) return;
    const index = Number(block.dataset.requestIndex);
    const request = requestOptions[currentRequestMode].requests[index];
    if (control.matches('select[data-option="model"]')) request.model = control.value;
    if (control.matches('input[data-option="reasons"]')) request.reasons = control.checked;
    if (control.matches('input[data-option="unrestricted"]')) request.unrestricted = control.checked;
    const segment = control.closest('[data-option="resultMode"]');
    if (segment && control.dataset.value) request.resultMode = control.dataset.value;
    persistRequestOptions();
    renderRequestOptions();
  }

  function saveRequestOptions() { persistRequestOptions(); closeRequestOptions(); }

  function showRequestOptionsHelp() { showModal(i18n[currentLang].optionsHelp); }

  function renderPromptLists() {
    ['tone', 'more', 'grammar'].forEach(function(kind) {
      const select = $(kind + '-prompt-list');
      if (!select) return;
      select.innerHTML = '<option value="">' + escapeHtml(i18n[currentLang].savedPrompts) + '</option>' + customPromptLists[kind].map(function(item, index) {
        return '<option value="' + index + '">' + escapeHtml(item.name) + '</option>';
      }).join('');
    });
  }

  function saveCustomPrompt(kind) {
    const sourceId = kind === 'tone' ? 'tone-prompt' : kind === 'more' ? 'more-input' : 'grammar-prompt';
    const value = $(sourceId).value.trim();
    if (!value) return;
    const name = value.slice(0, 30) || 'Prompt ' + (customPromptLists[kind].length + 1);
    customPromptLists[kind].push({ name: name, text: value });
    storeLocalData('translator_custom_prompts', customPromptLists);
    renderPromptLists();
  }

  function applyCustomPrompt(kind, index) {
    if (index === '') return;
    const item = customPromptLists[kind][Number(index)];
    if (!item) return;
    const targetId = kind === 'tone' ? 'tone-prompt' : kind === 'more' ? 'more-input' : 'grammar-prompt';
    $(targetId).value = item.text;
  }

  function populateModelOptions() {}

  // ===== Settings =====
  function keyInputId(provider) { return provider + '-key-input'; }
  function keyStorageId(provider) { return provider + '_api_key'; }

  function toggleSettings() {
    isSettingsOpen = !isSettingsOpen;
    $("settings-panel").style.display = isSettingsOpen ? '' : 'none';
    if (isSettingsOpen) {
      ['moonshot', 'openai', 'anthropic'].forEach(function(provider) {
        const input = $(keyInputId(provider));
        input.value = localStorage.getItem(keyStorageId(provider)) || '';
        input.type = 'password';
      });
      $("model-input").value = localStorage.getItem('moonshot_model') || '';
      document.querySelectorAll('.key-toggle').forEach(function(button) { button.textContent = i18n[currentLang].show; });
    }
  }

  function saveApiKey() {
    const model = $("model-input").value.trim();
    ['moonshot', 'openai', 'anthropic'].forEach(function(provider) {
      const key = $(keyInputId(provider)).value.trim();
      if (key) localStorage.setItem(keyStorageId(provider), key);
      else localStorage.removeItem(keyStorageId(provider));
      $(keyInputId(provider)).type = 'password';
    });
    if (model) localStorage.setItem('moonshot_model', model); else localStorage.removeItem('moonshot_model');
    showModal(i18n[currentLang].saved);
  }

  function clearApiKey() {
    ['moonshot', 'openai', 'anthropic'].forEach(function(provider) { localStorage.removeItem(keyStorageId(provider)); $(keyInputId(provider)).value = ''; });
    localStorage.removeItem('moonshot_model');
    $("model-input").value = '';
    showModal(i18n[currentLang].cleared);
  }

  function toggleKeyVisibility(provider) {
    const input = $(keyInputId(provider));
    const btn = document.querySelector('.key-toggle[data-key-provider="' + provider + '"]');
    const t = i18n[currentLang];
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? t.show : t.hide;
  }

  function updateXvibeUI() {
    populateModelOptions();
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
    $('btn-check').textContent = t.checkBtn;
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
    $('history-title').textContent = t.historyLabel;
    $('footer-credits-label').textContent = t.footerCredits;
    $("footer-credits-text").innerHTML = t.footerCreditsText;
    $("btn-clear").textContent = t.clear;
    $("btn-reset").textContent = t.reset;
    $('btn-grammar-clear').textContent = t.clear;
    $('btn-grammar-reset').textContent = t.reset;
    $('options-title').textContent = t.optionsTitle;
    $('options-count-label').textContent = t.optionsCount;
    $('btn-history-clear').textContent = t.historyClearAll;
    $('undo-message').textContent = t.historyUndo;
    $('btn-undo').title = t.historyUndo;
    $('btn-undo').setAttribute('aria-label', t.historyUndo);
    $('tutorial-title').textContent = t.footerUsage;
    $('personal-credit-title').textContent = t.personalCreditTitle;
    renderPromptLists();
    if (activeRequestConfig) renderResultCards(activeRequestConfig);

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
    const labelMoonshotKey = $("label-moonshot-key");
    if (labelMoonshotKey) labelMoonshotKey.textContent = t.apiKeyLabel;
    const labelOpenaiKey = $("label-openai-key");
    if (labelOpenaiKey) labelOpenaiKey.textContent = t.apiKeyOpenAI;
    const labelAnthropicKey = $("label-anthropic-key");
    if (labelAnthropicKey) labelAnthropicKey.textContent = t.apiKeyAnthropic;
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
    document.querySelectorAll('.key-toggle').forEach(function(button) {
      const input = $(keyInputId(button.getAttribute('data-key-provider')));
      button.textContent = input && input.type === 'password' ? t.show : t.hide;
    });
    if (!$('request-options').hidden) renderRequestOptions();

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
    activeRequestConfig = null;
    if (historyByMode[mode].index >= 0) showHistory(historyByMode[mode].index);
    else renderHistoryControls();
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
    loadingOperations = Math.max(0, loadingOperations + (show ? 1 : -1));
    show = loadingOperations > 0;
    $('loading').classList.toggle('show', show);
    $('loading-spinner').classList.toggle('show', show);
    const img = $('loading-img');
    if (img) img.src = (isXvibe && currentMode === 'translate') ? 'loading2.svg' : 'thinking.svg';
    const text = $('loading-text');
    if (show) {
      loadingTipIndex = 0;
      text.textContent = loadingTips[loadingTipIndex];
      clearInterval(loadingTimer);
      loadingTimer = setInterval(function() {
        loadingTipIndex = (loadingTipIndex + 1) % loadingTips.length;
        text.textContent = loadingTips[loadingTipIndex];
      }, 3000);
    } else {
      clearInterval(loadingTimer);
      loadingTimer = null;
      text.textContent = '';
    }
  }

  function hideResult() {
    $("result-box").classList.remove("show", "guide-mode");
  }

  function renderResult(text, mode, target) {
    const body = target || $('result-body');
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
    $("result-box").classList.remove('guide-mode');
    $("result-box").classList.add("show");
  }

  function renderGuideConversation(entry, target, requestIndex) {
    const body = target || $('result-body');
    const index = requestIndex === undefined ? 0 : requestIndex;
    const turns = Array.isArray(entry.guideTurns) ? entry.guideTurns : (entry.output ? [{ role: 'assistant', content: entry.output }] : []);
    const responseCount = turns.filter(function(turn) { return turn.role === 'assistant'; }).length;
    const t = i18n[currentLang];
    let html = '';
    let pendingUser = null;
    let renderedResponses = 0;
    turns.forEach(function(turn) {
      if (turn.role === 'user') {
        pendingUser = turn.content || '';
        return;
      }
      if (turn.role !== 'assistant') return;
      renderedResponses++;
      if (pendingUser !== null) {
        html += '<div class="guide-user-box">' + escapeHtml(pendingUser) + '</div>';
        pendingUser = null;
      }
      const resultLabel = renderedResponses === 1 ? t.result : t.result + '(' + renderedResponses + ')';
      const isLast = renderedResponses === responseCount;
      const canContinue = isLast && responseCount < 5;
      const continueOpen = canContinue && entry.guideContinueOpen;
      html += '<div class="guide-frame"><div class="guide-frame-header"><span class="guide-label">' + escapeHtml(resultLabel) + '</span><div class="guide-external-actions"><button class="copy-btn" data-action="retry" data-index="' + index + '">' + escapeHtml(t.retry) + '</button><button class="copy-btn" data-action="copy" data-index="' + index + '">' + escapeHtml(t.copy) + '</button></div></div><div class="guide-turn guide-assistant">' + escapeHtml(turn.content || '') + '</div>';
      if (canContinue) {
        if (continueOpen) {
          html += '<div class="guide-continue guide-continue-open"><textarea class="guide-input" placeholder="' + escapeAttribute(t.guideContinuePlaceholder || t.retryFeedbackPlaceholder) + '"></textarea><button class="guide-send" data-action="guide-send" data-index="' + index + '" disabled>' + escapeHtml(t.guideSend || 'Send') + '</button></div>';
        } else {
          html += '<button class="guide-continue-button" data-action="guide-open" data-index="' + index + '">' + escapeHtml(t.guideContinue || 'continue') + '</button>';
        }
      } else if (isLast) {
        html += '<button class="guide-continue-button" disabled>' + escapeHtml(t.guideContinue || 'continue') + '</button>';
      }
      html += '</div>';
    });
    body.innerHTML = html;
    if (!target) $('result-box').classList.add('guide-mode', 'show');
  }

  function renderResultCards(entries) {
    if (entries.length && entries.every(function(entry) { return entry.mode === 'grammar' && entry.grammarMode === 'expression-guide'; })) {
      const body = $('result-body');
      body.innerHTML = '';
      entries.forEach(function(entry, index) {
        const requestBody = document.createElement('div');
        requestBody.className = 'guide-request';
        requestBody.dataset.requestIndex = index;
        body.appendChild(requestBody);
        renderGuideConversation(entry, requestBody, index);
      });
      $('result-box').classList.add('guide-mode', 'show');
      return;
    }
    const body = $('result-body');
    body.innerHTML = '';
    entries.forEach(function(entry, index) {
      const card = document.createElement('section');
      card.className = 'result-card';
      const modelLabel = (supportedModels.find(function(model) { return model.value === entry.modelChoice; }) || {}).label || entry.model || entry.provider;
      const disabled = entry.pending ? ' disabled' : '';
      card.innerHTML = '<div class="card-header"><strong>Request ' + (index + 1) + ' · ' + modelLabel + '</strong><div class="card-actions"><button class="copy-btn" data-action="retry" data-index="' + index + '"' + disabled + '>' + escapeHtml(i18n[currentLang].retry) + '</button><button class="copy-btn" data-action="copy" data-index="' + index + '"' + disabled + '>' + escapeHtml(i18n[currentLang].copy) + '</button></div></div><div class="card-feedback" data-feedback="' + index + '" hidden><textarea class="retry-input" placeholder="' + escapeAttribute(i18n[currentLang].retryFeedbackPlaceholder) + '"></textarea><div class="retry-actions"><button class="btn" data-action="retry-submit" data-index="' + index + '">' + escapeHtml(i18n[currentLang].retrySubmit) + '</button><button class="btn-secondary" data-action="retry-plain" data-index="' + index + '">' + escapeHtml(i18n[currentLang].retryPlain) + '</button><button class="btn-secondary" data-action="retry-cancel" data-index="' + index + '">' + escapeHtml(i18n[currentLang].retryCancel) + '</button></div></div><div class="card-result result-body"></div><div class="card-error" data-error="' + index + '"></div>';
      body.appendChild(card);
      const resultTarget = card.querySelector('.card-result');
      const errorTarget = card.querySelector('.card-error');
      if (entry.output) renderResult(entry.output, entry.mode, resultTarget);
      if (entry.error) errorTarget.hidden = true;
    });
    $('result-box').classList.remove('guide-mode');
    $('result-box').classList.add('show');
  }

  function showResult(text, mode) {
    renderResult(text, mode);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttribute(text) {
    return escapeHtml(text).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

  async function sendRequest(mode, text, customPrompt, targetLang, grammarMode, termGuidance) {
    const options = JSON.parse(JSON.stringify(requestOptions[mode]));
    const count = options.count === 2 ? 2 : 1;
    const entries = [];
    for (let i = 0; i < count; i++) {
      let selected = (options.requests[i] && options.requests[i].model) || 'kimi';
      if (selected === 'grok' && !isXvibe) selected = 'kimi';
      const mapping = modelProviders[selected];
      if (!mapping || (mapping.provider === 'grok' && !isXvibe)) {
        showModal(selected + ' is not available in this build.');
        return;
      }
      const provider = (mode === 'translate' && isXvibe) ? 'grok' : mapping.provider;
      const request = options.requests[i] || defaultRequestOptions[mode].requests[i];
      const providerKey = localStorage.getItem(provider === 'kimi' ? 'moonshot_api_key' : provider + '_api_key') || '';
      entries.push({ mode: mode, text: text, customPrompt: customPrompt || '', termGuidance: termGuidance || '', targetLang: targetLang, grammarMode: grammarMode, resultMode: request.resultMode, reasons: !!request.reasons, unrestricted: !!request.unrestricted, provider: provider, model: provider === 'grok' ? 'grok-4.3' : mapping.model, modelChoice: provider === 'grok' ? 'grok' : selected, apiKey: providerKey, output: '', error: '', pending: true, options: JSON.parse(JSON.stringify(request)) });
    }
    currentRequestMode = mode;
    activeRequestConfig = entries;
    renderResultCards(entries);
    setLoading(true);
    await Promise.all(entries.map(function(entry, index) { return doRequest(entry, index); }));
    setLoading(false);
    const errors = entries.filter(function(entry) { return entry.error; }).map(function(entry, index) {
      return 'Request ' + (index + 1) + ': ' + entry.error;
    });
    if (errors.length) {
      showModal(i18n[currentLang].errorGenericTitle + '\n\n' + errors.join('\n') + '\n\n' + i18n[currentLang].errorGenericSuggest);
    }
    if (entries.some(function(entry) { return !!entry.output; })) saveHistory(mode, text, entries);
  }

  async function doRequest(entry, index, feedback, previousOutput) {
    try {
      const payload = { mode: entry.mode, text: entry.text, customPrompt: entry.customPrompt, termGuidance: entry.termGuidance, targetLang: entry.targetLang, provider: entry.provider, model: entry.model, resultMode: entry.resultMode, reasons: entry.reasons, unrestricted: entry.unrestricted };
      if (entry.grammarMode) payload.grammarMode = entry.grammarMode;
      if (entry.conversation) payload.conversation = entry.conversation;
      if (entry.apiKey) {
        payload.userApiKey = entry.apiKey;
        if (entry.provider === 'openai') payload.openaiApiKey = entry.apiKey;
        if (entry.provider === 'anthropic') payload.anthropicApiKey = entry.apiKey;
      }
      if (entry.provider === 'kimi') {
        const userModel = localStorage.getItem('moonshot_model');
        if (userModel) payload.userModel = userModel;
      }
      if (feedback) {
        payload.feedback = feedback;
        payload.previousOutput = previousOutput || '';
      }
      const res = await fetch('/api/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const errData = await res.json().catch(function() { return {}; });
        throw new Error(errData.detail || errData.error || ('HTTP ' + res.status));
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.forEach(function(line) {
          line = line.trim();
          if (!line || line.indexOf('data: ') !== 0) return;
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            const json = JSON.parse(data);
            if (json.error) throw new Error(json.error.message || 'API Error');
            if (json.type === 'content_block_delta' && json.delta) {
              fullText += json.delta.text || '';
            } else {
              fullText += (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) || '';
            }
          } catch (error) {
            if (error.message !== 'Unexpected end of JSON input') entry.error = error.message;
          }
        });
      }
      entry.output = fullText;
      if (entry.mode === 'grammar' && entry.grammarMode === 'expression-guide' && fullText && !entry.guideTurns) entry.guideTurns = [{ role: 'assistant', content: fullText }];
      if (!fullText && !entry.error) entry.error = 'Empty response';
    } catch (error) {
      entry.error = error.message || 'Request failed';
    }
    entry.pending = false;
    if (activeRequestConfig && activeRequestConfig[index] === entry) renderResultCards(activeRequestConfig);
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

    ensureHistoryRow("translate", text);
    sendRequest("translate", text, finalPrompt, targetLang, null, termGuidance);
  }

  function sendGrammar() {
    const text = $("grammar-input").value.trim();
    if (!text) { showModal(i18n[currentLang].errorEmpty); return; }
    grammarPrompt = $("grammar-prompt").value;
    const customPrompt = $("grammar-prompt").value.trim();
    const grammarMode = (customPrompt === grammarOnlyPrompt) ? 'grammar-only' : 'expression-guide';
    ensureHistoryRow("grammar", text);
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
        '<input type="text" class="term-translation" placeholder="' + escapeAttribute(i18n[currentLang].termTranslationPh || '可选：指定译法') + '" value="' + escapeAttribute(item.translation || '') + '" style="' + transDisplay + '" oninput="window.TranslatorI18n.setTermTranslation(' + idx + ', this.value)">' +
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

  function normalizeInput(text) {
    return String(text || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function ensureHistoryRow(mode, text) {
    const state = historyByMode[mode];
    const key = normalizeInput(text);
    let row = state.rows.find(function(item) { return item.key === key; });
    if (!row) {
      row = { key: key, text: text, createdAt: Date.now(), versions: [] };
      state.rows.push(row);
    }
    row.text = text;
    state.index = state.rows.indexOf(row);
    state.version = row.versions.length - 1;
    persistHistory();
    renderHistoryControls();
    return row;
  }

  function persistHistory() {
    while (!storeLocalData('translator_histories', {
      translate: { rows: historyByMode.translate.rows },
      grammar: { rows: historyByMode.grammar.rows }
    })) {
      let oldest = null;
      ['translate', 'grammar'].forEach(function(mode) {
        historyByMode[mode].rows.forEach(function(row, index) {
          const createdAt = Number(row.createdAt);
          const candidate = { mode: mode, index: index, createdAt: Number.isFinite(createdAt) ? createdAt : 0 };
          if (!oldest || candidate.createdAt < oldest.createdAt) oldest = candidate;
        });
      });
      if (!oldest) return false;

      const state = historyByMode[oldest.mode];
      const removedSelectedRow = state.index === oldest.index;
      state.rows.splice(oldest.index, 1);
      if (!state.rows.length) {
        state.index = -1;
        state.version = -1;
      } else {
        if (state.index > oldest.index) state.index--;
        else if (removedSelectedRow) state.index = Math.min(oldest.index, state.rows.length - 1);
        if (state.index >= state.rows.length) state.index = state.rows.length - 1;
        if (removedSelectedRow && state.index >= 0) {
          const versions = state.rows[state.index].versions || [];
          state.version = versions.length ? versions.length - 1 : -1;
        } else if (state.index >= 0) {
          const versions = state.rows[state.index].versions || [];
          state.version = versions.length ? Math.min(Math.max(state.version, 0), versions.length - 1) : -1;
        }
      }
    }
    return true;
  }

  function saveHistory(mode, text, entries) {
    const state = historyByMode[mode];
    const key = normalizeInput(text);
    let row = state.rows.find(function(item) { return item.key === key; });
    if (!row) {
      row = { key: key, text: text, createdAt: Date.now(), versions: [] };
      state.rows.push(row);
    }
    row.text = text;
    const historyEntries = entries.map(function(entry) {
      const safeEntry = Object.assign({}, entry);
      delete safeEntry.apiKey;
      return safeEntry;
    });
    row.versions.push({ createdAt: Date.now(), entries: JSON.parse(JSON.stringify(historyEntries)) });
    state.index = state.rows.indexOf(row);
    state.version = row.versions.length - 1;
    persistHistory();
    renderHistoryControls();
    if (currentMode === mode) renderResultCards(entries);
  }

  function renderHistoryControls() {
    const state = historyByMode[currentMode];
    const list = $('history-list');
    const nav = $('history-nav');
    const page = $('history-page');
    list.innerHTML = '';
    nav.style.display = state.rows.length > 1 ? 'flex' : 'none';
    if (state.rows.length) page.textContent = (state.index + 1) + '/' + state.rows.length;
    state.rows.forEach(function(row, index) {
      const item = document.createElement('div');
      item.className = 'history-row' + (index === state.index ? ' active' : '');
      const preview = row.text.length > 80 ? row.text.slice(0, 80) + '…' : row.text;
      item.innerHTML = '<button class="history-select" data-action="select-history" data-index="' + index + '">' + escapeHtml(preview) + '</button><button class="history-delete" data-action="delete-history" data-index="' + index + '" title="Delete">×</button>';
      list.appendChild(item);
    });
    const versionSelect = $('history-version');
    if (versionSelect) {
      const row = state.rows[state.index];
      versionSelect.innerHTML = row ? row.versions.map(function(version, index) { return '<option value="' + index + '">v' + (index + 1) + '</option>'; }).join('') : '';
      versionSelect.value = row ? String(state.version) : '';
      versionSelect.hidden = !row || row.versions.length < 2;
    }
  }

  async function showHistory(index) {
    const state = historyByMode[currentMode];
    if (index < 0 || index >= state.rows.length) return;
    const row = state.rows[index];
    const input = currentMode === 'translate' ? $('translate-input') : $('grammar-input');
    if (input.value.trim() && normalizeInput(input.value) !== row.key) {
      if (!await confirmModal(i18n[currentLang].confirmRestore)) return;
    }
    input.value = row.text || '';
    state.index = index;
    state.version = Math.max(0, (row.versions || []).length - 1);
    showHistoryVersion(state.version);
  }

  function showHistoryVersion(versionIndex) {
    const state = historyByMode[currentMode];
    const row = state.rows[state.index];
    if (!row) return;
    state.version = Number(versionIndex);
    const version = (row.versions || [])[state.version];
    if (!version || !version.entries) {
      activeRequestConfig = null;
      hideResult();
      renderHistoryControls();
      return;
    }
    activeRequestConfig = version.entries;
    currentRequestMode = currentMode;
    renderResultCards(activeRequestConfig);
    renderHistoryControls();
  }

  function historyPrev() {
    const state = historyByMode[currentMode];
    if (state.index > 0) showHistory(state.index - 1);
  }

  function historyNext() {
    const state = historyByMode[currentMode];
    if (state.index < state.rows.length - 1) showHistory(state.index + 1);
  }

  function setUndo(snapshot) {
    undoSnapshot = snapshot;
    clearTimeout(undoTimer);
    $('history-undo').hidden = false;
    undoTimer = setTimeout(function() {
      undoSnapshot = null;
      $('history-undo').hidden = true;
    }, 5000);
  }

  function clearHistory() {
    const state = historyByMode[currentMode];
    if (!state.rows.length) return;
    setUndo({ mode: currentMode, rows: JSON.parse(JSON.stringify(state.rows)), index: state.index, version: state.version });
    state.rows = [];
    state.index = -1;
    state.version = 0;
    activeRequestConfig = null;
    persistHistory();
    $('result-body').innerHTML = '';
    hideResult();
    renderHistoryControls();
  }

  function deleteHistory(index) {
    const state = historyByMode[currentMode];
    if (!state.rows[index]) return;
    setUndo({ mode: currentMode, rows: JSON.parse(JSON.stringify(state.rows)), index: state.index, version: state.version });
    state.rows.splice(index, 1);
    state.index = Math.min(state.rows.length - 1, Math.max(0, state.index - (index < state.index ? 1 : 0)));
    state.version = 0;
    persistHistory();
    if (state.index >= 0) showHistory(state.index);
    else {
      activeRequestConfig = null;
      $('result-body').innerHTML = '';
      hideResult();
    }
    renderHistoryControls();
  }

  function undoHistory() {
    if (!undoSnapshot) return;
    const snapshot = undoSnapshot;
    const state = historyByMode[snapshot.mode];
    state.rows = snapshot.rows;
    state.index = snapshot.index;
    state.version = snapshot.version;
    undoSnapshot = null;
    clearTimeout(undoTimer);
    $('history-undo').hidden = true;
    persistHistory();
    const previousMode = currentMode;
    currentMode = snapshot.mode;
    if (state.index >= 0) showHistoryVersion(state.version);
    currentMode = previousMode;
    renderHistoryControls();
  }

  function handleHistoryAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const index = Number(button.getAttribute('data-index'));
    if (button.getAttribute('data-action') === 'select-history') showHistory(index);
    if (button.getAttribute('data-action') === 'delete-history') deleteHistory(index);
  }

  function handleResultAction(event) {
    const versionSelect = event.target.closest('#history-version');
    if (versionSelect) { showHistoryVersion(Number(versionSelect.value)); return; }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.getAttribute('data-action');
    const index = Number(button.getAttribute('data-index'));
    if (!activeRequestConfig || !activeRequestConfig[index]) return;
    if (action === 'guide-open') {
      activeRequestConfig[index].guideContinueOpen = true;
      renderResultCards(activeRequestConfig);
      const requestBody = $('result-body').querySelector('.guide-request[data-request-index="' + index + '"]');
      const input = requestBody && requestBody.querySelector('.guide-input');
      if (input) input.focus();
      return;
    }
    if (action === 'guide-send') {
      const requestBody = button.closest('.guide-request');
      const input = requestBody && requestBody.querySelector('.guide-input');
      const message = input && input.value.trim();
      if (message) sendGuideContinuation(index, message);
      return;
    }
    const card = button.closest('.result-card');
    if (!card && action !== 'copy' && action !== 'retry') return;
    if (action === 'retry' && activeRequestConfig[index].grammarMode === 'expression-guide') {
      return retryGuide(index);
    }
    if (action === 'retry') {
      const feedback = card.querySelector('.card-feedback');
      feedback.hidden = !feedback.hidden;
      if (!feedback.hidden) feedback.querySelector('textarea').focus();
    } else if (action === 'retry-cancel') {
      card.querySelector('.card-feedback').hidden = true;
    } else if (action === 'copy') {
      const output = activeRequestConfig[index].output || '';
      if (navigator.clipboard) navigator.clipboard.writeText(output).catch(function() {});
      else {
        const textarea = document.createElement('textarea');
        textarea.value = output;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } else if (action === 'retry-submit' || action === 'retry-plain') {
      const feedback = action === 'retry-submit' ? card.querySelector('textarea').value.trim() : '';
      return retryCard(index, feedback);
    }
  }

  async function retryGuide(index) {
    const previous = activeRequestConfig && activeRequestConfig[index];
    if (!previous) return;
    const entry = Object.assign({}, previous, { output: '', error: '', pending: true, guideTurns: null, conversation: undefined, guideContinueOpen: false });
    activeRequestConfig[index] = entry;
    renderResultCards(activeRequestConfig);
    setLoading(true);
    await doRequest(entry, index);
    setLoading(false);
    if (entry.output && !entry.error) {
      saveHistory('grammar', previous.text, activeRequestConfig.map(function(item) { return Object.assign({}, item); }));
    } else {
      showModal(i18n[currentLang].errorGenericTitle + '\\n\\n' + (entry.error || i18n[currentLang].errorGenericSuggest));
      activeRequestConfig[index] = previous;
      renderResultCards(activeRequestConfig);
    }
  }

  async function sendGuideContinuation(index, message) {
    const previous = activeRequestConfig && activeRequestConfig[index];
    if (!previous || previous.mode !== 'grammar') return;
    const turns = Array.isArray(previous.guideTurns) ? previous.guideTurns.slice() : [{ role: 'assistant', content: previous.output || '' }];
    const responseCount = turns.filter(function(turn) { return turn.role === 'assistant'; }).length;
    if (responseCount >= 5) return;
    const entry = Object.assign({}, previous, { output: '', error: '', pending: true, guideTurns: turns.concat([{ role: 'user', content: message }]), conversation: turns.concat([{ role: 'user', content: message }]) });
    activeRequestConfig[index] = entry;
    renderResultCards(activeRequestConfig);
    setLoading(true);
    await doRequest(entry, index);
    setLoading(false);
    if (entry.output && !entry.error) {
      entry.guideTurns.push({ role: 'assistant', content: entry.output });
      entry.conversation = entry.guideTurns.slice();
      saveHistory('grammar', entry.text, activeRequestConfig.map(function(item) { return Object.assign({}, item); }));
    } else {
      showModal(i18n[currentLang].errorGenericTitle + '\n\n' + (entry.error || i18n[currentLang].errorGenericSuggest));
      activeRequestConfig[index] = previous;
      renderResultCards(activeRequestConfig);
    }
  }

  async function retryCard(index, feedback) {
    const previous = activeRequestConfig && activeRequestConfig[index];
    if (!previous) return;
    const mode = currentMode;
    const entry = Object.assign({}, previous, { output: '', error: '' });
    setLoading(true);
    activeRequestConfig[index] = entry;
    renderResultCards(activeRequestConfig);
    await doRequest(entry, index, feedback, previous.output);
    const rowState = historyByMode[mode];
    const key = normalizeInput(previous.text);
    const row = rowState.rows.find(function(item) { return item.key === key; });
    const latest = row && row.versions.length ? row.versions[row.versions.length - 1].entries : activeRequestConfig;
    const baseEntries = latest.map(function(item) { return Object.assign({}, item); });
    baseEntries[index] = entry;
    setLoading(false);
    saveHistory(mode, previous.text, baseEntries);
  }


  window.addEventListener('DOMContentLoaded', function() {
    loadLocalData();
    populateModelOptions();
    $('tone-prompt').value = prompts.natural;
    $('grammar-prompt').value = grammarPrompt;
    renderRequestOptions();
    ['translate', 'grammar'].forEach(function(mode) {
      const state = historyByMode[mode];
      state.index = state.rows.length - 1;
      const row = state.rows[state.index];
      state.version = row ? row.versions.length - 1 : -1;
    });
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
    setLang('en');
    renderTermList();
    renderHistoryControls();
    if (historyByMode.translate.index >= 0) showHistory(historyByMode.translate.index);
  });
})();