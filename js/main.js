---
---

var TAGS_TO_FILTERS = {
  lang: 'language',
  ctry: 'country',
  cat: 'category',
  src: 'datasource',
  license: 'license'
};


var CATEGORY_ICONS = {
  blog: 'pencil-square', //  newspaper-o
  ecommerce: 'shopping-cart',
  catalog: 'map', // book
  personal: 'user',
  corporate: 'briefcase',
  landing: 'image',
  framework: 'puzzle-piece',
  edu: 'graduation-cap',
  social: 'group'
};

var DATASOURCE_ICONS = {
  official: 'check',
  community: 'users'
};

var SITE_SUPER_DOMAIN = '.{{ site.websites_super_domain }}';


//
// Init Markdown renderer
//
md = new Remarkable({
  html:         true,        // Enable HTML tags in source
  xhtmlOut:     false,        // Use '/' to close single tags (<br />)
  breaks:       false,        // Convert '\n' in paragraphs into <br>
  langPrefix:   'language-',  // CSS language prefix for fenced blocks
  linkify:      false,        // Autoconvert URL-like text to links

  // Enable some language-neutral replacement + quotes beautification
  typographer:  false,

  // Double + single quotes replacement pairs, when typographer enabled,
  // and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
  quotes: '“”‘’',

  // Highlighter function. Should return escaped HTML,
  // or '' if the source string is not changed
  highlight: function (/*str, lang*/) { return ''; }
});


function isEmptyPathnameIgnoreLanguage(pathname) {
  var pathnameParts = pathname.split('/').filter(function(part) { return part !== ''; });
  return pathnameParts.length === 0 || pathnameParts.length === 1 && pathnameParts[0].length <= 2;
}

function search_parseQuery() {
  var ret = '';
  var params = MDSCommon.parseQuery(window.location.search);
  if (MDSCommon.isPresent(params.tags)) {
    var tags = params.tags.split(',');
    tags.forEach(function(tag) {
      if (tag[0] !== '@') {
        ret += '#';
      }
      ret += tag + ' ';
    });
  }
  if (MDSCommon.isPresent(params.q)) {
    ret += params.q;
  }
  return ret;
}

function search_parseSearchString(search, useFilterTags) {
  var tags = [];
  var newSearch = '';
  var filters = {};
  // var type;
  var parts = search.split(/\s+/);
  for (var i in parts) {
    var part = parts[i];
    if (part[0] === '#') {
      var filter2val = part.split(':');
      if (filter2val.length === 1) {
        tags.push(part.substring(1));
      } else {
        var filter = useFilterTags ? filter2val[0].substring(1) : TAGS_TO_FILTERS[filter2val[0].substring(1)];
        if (filter) {
          filters[filter] = filter2val[1];
        }
      }
    } else {
      if (newSearch !== '') {
        newSearch += ' ';
      }
      newSearch += part;
    }
  }

  return {
    search: newSearch,
    filters: filters,
    tags: tags,
    type: 't'
  }
}

function search_getQueryFromSearchString(search) {
  var options = search_parseSearchString(search, true);
  var ret = '';
  for (var filter in options.filters) {
    if (ret === '') {
      ret += 'tags='
    } else {
      ret += ','
    }
    ret += filter + ':' + options.filters[filter];
  }

  options.tags.forEach(function(tag) {
    if (ret === '') {
      ret += 'tags='
    } else {
      ret += ','
    }
    ret += tag;
  });

  if (MDSCommon.isPresent(options.search)) {
    if (ret !== '') {
      ret += '&'
    }
    ret += 'q=' + options.search;
  }

  if (ret === '') {
    return '';
  }
  return '?' + ret;
}


function getHtmlFromTemplate(template, data) {
  var ret = '';
  var state = '';
  var statement;
  for (var i = 0; i < template.length; i++) {
    var c = template[i];
    switch (c) {
      case '{':
        switch (state) {
          case 'left_brace':
            state = 'statement';
            statement = '';
            break;
          case '':
            state = 'left_brace';
            break;
          default:
            throw new Error('Unexpected character');
        }
        break;
      case '}':
        switch (state) {
          case 'statement':
            state = 'right_brace';
            break;
          case 'right_brace':
            ret += data[statement];
            statement = null;
            state = '';
            break;
          case '':
            ret += c;
            break;
          default:
            throw new Error('Unexpected character');
        }
        break;
      default:
        switch (state) {
          case 'statement':
            var code = c.charCodeAt(0);
            if (c === '_' || c === '-' || c === '.' ||
                code >= 'a'.charCodeAt(0) && code <= 'z'.charCodeAt(0) ||
                code >= 'A'.charCodeAt(0) && code <= 'Z'.charCodeAt(0) ||
                code >= '0'.charCodeAt(0) && code <= '9'.charCodeAt(0)) {
              statement += c;
            } else if (c !== ' ') {
              throw new Error('Unexpected character');
            }
            break;
          case 'left_brace':
            state = '';
            ret += '{' + c;
            break;
          default:
            ret += c;
        }
        break;
    }
  }
  return ret;
}

function parseSnippetTemplate(template) {
  if (template == null) {
    throw new Error('Parameter template can not be null');
  }

  var parts = template.split(/^---$/gm);
  return {
    scripts: MDSView.compile(parts[0] || ''),
    css: parts[1],
    template: Handlebars.compile(parts[2] || '')
  };
}

function parseSingleScript(s, fields) {
  var state = 'helper_name';
  var helperName = '';
  var options = [];
  s += ' ';
  for (var i in s) {
    var c = s[i];
    switch (c) {
      case ' ':
        switch (state) {
          case 'space':
            break;
          case 'helper_name':
            state = 'space';
            break;
          case 'string':
            options[options.length-1] += c;
            break;
          case 'option':
            options[options.length-1] = fields[options[options.length-1]];
            state = 'space';
            break;
          default:
            throw new Error('Unexpected char' + c + ' in state ' + state);
        }
        break;
      case '"':
        switch (state) {
          case 'space':
            options.push('');
            state = 'string';
            break;
          case 'string':
            state = 'space';
            break;
          case 'helper_name':
          case 'option':
          default:
            throw new Error('Unexpected char' + c + ' in state ' + state);
            break;
        }
        break;
      default:
        switch (state) {
          case 'space':
            state = 'option';
            options.push(c);
            break;
          case 'string':
            options[options.length-1] += c;
            break;
          case 'helper_name':
            helperName += c;
            break;
          case 'option':
            options[options.length-1] += c;
            break;
          default:
            throw new Error('Unexpected char ' + c + ' in state ' + state);
            break;
        }
        break;
    }
  }
  return MDSView.helpers[helperName] ? MDSView.helpers[helperName](options) : '';
}

function parseScripts(scripts, fields) {
  return scripts.split('\n').filter(function(l) { return l.trim() !== ''; }).map(function(l) {
    return parseSingleScript(l, fields);
  });
}

MDSView = {
  helpers: {},
  registerHelper: function(name, fn) {
    MDSView.helpers[name] = fn;
  },
  registerSource: function(name, src) {
    if (typeof src !== 'string') {
      throw new Error('src must be string');
    }
    MDSView.helpers[name] = function() {
      return '<script>' +
      ' $.ajax({\n' +
      '    async: false,\n' +
      '    url: "' + src + '",\n' +
      '    dataType: "script"\n' +
      ' });' +
      '</script>';
    };

    // MDSView.helpers[name] = function() {
    //   return '<script>(function() {\n' +
    //     '    var req = new XMLHttpRequest();\n' +
    //     '    req.open("GET", "' + src + '", false);\n' +
    //     '    req.send();\n' +
    //     '    eval(req.responseText);\n' +
    //     '})();</script>';
    // };
  },

  compile: function(scripts) {
    return parseScripts.bind(MDSView, scripts);
  }
};

MDSView.registerSource('vk', 'https://vk.com/js/api/openapi.js?150');
MDSView.registerSource('ok', 'https://connect.ok.ru/connect.js');
MDSView.registerSource('ymaps', 'https://api-maps.yandex.ru/2.1/?lang=en_RU');


if (typeof Handlebars !== 'undefined') {

  Handlebars.registerHelper("dateHumanized", function(timestamp) {
    var date = MDSCommon.timestampToDate(timestamp);
    return MDSCommon.humanizeDate(date);
  });


  Handlebars.registerHelper("dateISO", function(timestamp) {
    var date = MDSCommon.timestampToDate(timestamp);
    return String(date.getFullYear() + '-' +
      MDSCommon.intToFixedString(date.getMonth() + 1, 2) + '-' +
      MDSCommon.intToFixedString(date.getDate(), 2) + ' ' +
      MDSCommon.intToFixedString(date.getHours(), 2) + ':' +
      MDSCommon.intToFixedString(date.getMinutes(), 2)
    );
  });

  Handlebars.registerHelper("dateUS", function(timestamp) {
    var date = MDSCommon.timestampToDate(timestamp);
    return String(
      MDSCommon.intToFixedString(date.getMonth() + 1, 2) + '/' +
      MDSCommon.intToFixedString(date.getDate(), 2) + '/' +
      date.getFullYear() + ' ' +
      MDSCommon.intToFixedString(date.getHours(), 2) + ':' +
      MDSCommon.intToFixedString(date.getMinutes(), 2)
    );
  });

  Handlebars.registerHelper("dateRU", function(timestamp) {
    var date = MDSCommon.timestampToDate(timestamp);
    return String(
      MDSCommon.intToFixedString(date.getDate(), 2) + '.' +
      MDSCommon.intToFixedString(date.getMonth() + 1, 2) + '.' +
      date.getFullYear() + ' ' +
      MDSCommon.intToFixedString(date.getHours(), 2) + ':' +
      MDSCommon.intToFixedString(date.getMinutes(), 2)
    );
  });
}

MDSView.registerHelper('ymapsAddr', function(options) {
  var address = encodeURIComponent(options[0] + ', ' + options[1]);
  return '<script>' +
    '$.getJSON(\'https://geocode-maps.yandex.ru/1.x/?geocode=' + address + '&format=json\', function(data) {\n' +
    '    var point = data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(\' \').map(function(p){ return parseFloat(p); }).reverse();\n' +
    '    var myMap = new ymaps.Map(\'ymap\', {\n' +
    '            center: point,\n' +
    '            zoom: 16\n' +
    '        });\n' +
    '    myMap.geoObjects.add(new ymaps.Placemark(point));\n' +
    '});' +
    '</script>';
});

MDSView.registerHelper('vkGroupWidget', function(options) {
  var vk_id = options[0];
  if (MDSCommon.isBlank(vk_id)) {
    return '';
  }
  return  '<script>VK.Widgets.Group("vk_groups_' + vk_id + '", {mode: 3}, ' + vk_id + ');</script>';
});

MDSView.registerHelper('vkGroupWidget', function(options) {
  var vk_id = options[0];
  if (MDSCommon.isBlank(vk_id)) {
    return '';
  }
  return  '<script>VK.Widgets.Group("vk_groups_' + vk_id + '", {mode: 3}, ' + vk_id + ');</script>';
});

MDSView.registerHelper('okGroupWidget', function(options) {
  var ok_id = options[0];
  if (MDSCommon.isBlank(ok_id)) {
    return '';
  }
  return  '<script>OK.CONNECT.insertGroupWidget("ok_group_widget_' + ok_id + '", ' + ok_id + ', \'{"width":200,"height":230}\');</script>';
});

if (typeof Handlebars !== 'undefined') {
  Handlebars.registerHelper('host', function(url) {
    var m = url.match(/^\w+:\/\/([^/]+)/);
    if (!m) {
      return url;
    }
    return m[1];
  });
}

/**
 * Add JSON-LD for Google Search Engine
 * @param {Object} data - Data received for root from MyDataSpace backend.
 */
function addJsonLD(data) {
  var script = document.querySelector('script[type="application/ld+json"]');
  if (!script) {
    script = document.createElement('script');
  }
  var fields = data.fields;
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    "@context": "http://schema.org",
    "@id": "https://mydataspace.org/" + data.root,
    "@type": "Dataset",
    "name":  MDSCommon.findValueByName(fields, 'name'),
    "description": MDSCommon.findValueByName(fields, 'description'),
    "keywords": MDSCommon.findValueByName(fields, 'tags')
  });
  document.querySelector('head').appendChild(script);
}

function getCodepenIDByURL(url) {
  var regex = /^https?:\/\/codepen.io\/(\w+)\/pen\/(\w+)/;
  var m = regex.exec(url);
  if (!m) {
    return null;
  }
  return m[1] + '/' + m[2];
}

function getCodepenURL(id) {
  var parts = id.split('/');
  return 'https://codepen.io/' + parts[0] + '/pen/' + parts[1];
}

function getPathnameParts(pathname) {
  if (pathname === '/root.html') {
    return ['test'];
  }
  var pathnameParts = pathname.split('/').filter(function(part) { return part !== ''; });
  if (pathnameParts[0].length <= 2) {
    pathnameParts.shift();
  }
  if (pathnameParts[0] !== 'skeletons') {
    throw new Error('This is not skeleton path');
  }
  pathnameParts.shift();
  return pathnameParts;
}

function getRequestFromLocation(loc) {
  var pathnameParts = getPathnameParts(loc.pathname);
  var searchParams = MDSCommon.parseQuery(loc.search);
  return {
    root: pathnameParts[0] === 'root' ? 'SUPER-TEMPLATE' : pathnameParts[0],
    path: '',
    version: searchParams.v
  };
}

function getURLLanguagePrefix(language) {
  return MDSCommon.isBlank(language) || language === 'en' ? '' : '/' + language;
}

function showWaitingCloak() {
  document.getElementById('waiting_cloak').style.display = 'block';
}

function hideWaitingCloak() {
  document.getElementById('waiting_cloak').style.display = 'none';
}


RootHelper = {
  validateLookForm: function() {
    document.getElementById('look_modal__title_err').innerText = '';
    document.getElementById('look_modal__codepen_err').innerText = '';

    var title = document.getElementById('look_modal__title').value;
    var codepen = document.getElementById('look_modal__codepen').value;

    if (MDSCommon.isBlank(title)) {
      document.getElementById('look_modal__title_err').innerText = tr$('title_cant_be_blank');
      return false;
    }

    if (title.length > 250) {
      document.getElementById('look_modal__title_err').innerText = tr$('too_long_title');
      return false;
    }

    switch ($('#look_modal').data('look-type')) {
      case 'codepen':
        if (MDSCommon.isBlank(codepen)) {
          document.getElementById('look_modal__codepen_err').innerText = tr$('codepen_url_cant_be_blank');
          return false;
        }
        var codepenID = getCodepenIDByURL(codepen);
        if (!codepenID) {
          document.getElementById('look_modal__codepen_err').innerText = tr$('invalid_codepen_pen_url');
          return false;
        }
        break;
      case 'table':
        break;
      case 'list':
        break;
    }
    return true;
  }
};



function parseJWT(token) {
  if (token == null || token === '') {
    throw new Error('JWT can\t be empty');
  }
  var parts = token.split('.');
  var base64Url = parts[1];
  if (base64Url == null) {
    throw new Error('JWT has Illegal format');
  }
  var base64 = base64Url.replace(/\-/g, '+').replace(/_/g, '/');
  // About niceties of window.btoa method.
  // https://developer.mozilla.org/ru/docs/Web/API/WindowBase64/btoa
  var json = decodeURIComponent(escape(window.atob(base64)));
  return JSON.parse(json);
}

function isValidJWT(token) {
  try {
    var json = parseJWT(token);
  } catch(e) {
    return false;
  }
  return json.exp * 1000 >= Date.now();
}





function showFeedbackModal(needClear) {
  if (needClear) {
    $('#give_feedback_modal__text').val('');
    $('#give_feedback_modal__send').prop('disabled', false);
    $('#give_feedback_modal__text').prop('disabled', false);
    $('#give_feedback_modal__text').removeClass('new_comment__textarea--error');
    $('#give_feedback_modal__error').text('');
  }
  $('#give_feedback_modal').modal('show');
}


function initFeedbackModal() {
  var $textarea = $('#give_feedback_modal__text');
  var $button = $('#give_feedback_modal__send');
  var $error = $('#give_feedback_modal__error');


  function giveFeedback() {
    $textarea.removeClass('new_comment__textarea--error');

    if ($textarea.val().trim() === '') {
      $textarea.addClass('new_comment__textarea--error');
      $error.text('{{ site.data[page.language].menu.feedback_cant_be_blank }}');
      $textarea.focus();
      return;
    }

    $button.prop('disabled', true);
    $textarea.prop('disabled', true);

    Mydataspace.request('entities.create', {
      root: 'feedback',
      path: 'data/' + MDSCommon.guid(),
      fields: [
        {
          name: 'text',
          value: $textarea.val().trim(),
          type: 's'
        },
        {
          name: 'rate',
          value: '0',
          type: 'i'
        }
      ]
    }, function () {
      $('#give_feedback_modal').modal('hide');
      $('#give_feedback_sent_modal').modal('show');
    }, function (err) {
      $button.prop('disabled', false);
      $textarea.prop('disabled', false);
      console.log(err);
      $error.text(err.message);
      $textarea.focus();
    });
  }


  $('#give_feedback_modal').on('shown.bs.modal', function () {
    setTimeout(function() {
      $textarea.focus();
    }, 300);
  });

  $button.click(function () {

    if (!Mydataspace.isLoggedIn()) {
      Mydataspace.on('login', function () {
        setTimeout(function() {
          showFeedbackModal();
          giveFeedback();
        }, 300);
      });
      $('#give_feedback_modal').modal('hide');
      setTimeout(function() {
        $('#signin_modal').modal('show');
      }, 300);
      return;
    }
    giveFeedback();
  });
}


function adminPanel_startWaiting(duration) {
  if (typeof adminPanel_waiting !== 'undefined' && adminPanel_waiting) {
    return;
  }
  // noinspection JSUndeclaredVariable Global variable
  adminPanel_waiting = true;
  $('#admin_panel__loading').show();
  $('#webix_preloaded_header').addClass('invisible');
  $('#logo_link').addClass('invisible');
  $('#no_items').addClass('invisible');
  $('#admin_panel').addClass('invisible');

  setTimeout(function() {
    delete adminPanel_waiting;
    $('#admin_panel__loading').hide();
    $('#webix_preloaded_header').removeClass('invisible');
    $('#logo_link').removeClass('invisible');
    $('#no_items').removeClass('invisible');
    $('#admin_panel').removeClass('invisible');
  }, duration);
}


/**
 *
 * @param {string} license
 */
function getLicenseWithoutVersion(license) {
  var i = license.lastIndexOf('-');
  if (i < 0) {
    return license;
  }
  var v = license.substr(i + 1);
  if (!MDSCommon.isNumber(v)) {
    return license;
  }
  return license.substr(0, i);
}

function getLicenseVersion(license) {
  var i = license.lastIndexOf('-');
  if (i < 0) {
    return null;
  }
  var v = license.substr(i + 1);
  return MDSCommon.isNumber(v) ? v : null;
}

function getLicenseDropContent(data, language, isCustomLicense) {

  var suffix = language === '' || language === 'en' ? '': '_' + language;

  var title = isCustomLicense ? tr$('licenses.custom') : (MDSCommon.findValueByName(data.fields, 'name' + suffix) || MDSCommon.findValueByName(data.fields, 'name'));
  var text = MDSCommon.findValueByName(data.fields, isCustomLicense ? 'licenseText' + suffix : 'text' + suffix);

  if (!text) {
    text = MDSCommon.findValueByName(data.fields, isCustomLicense ? 'licenseText' : 'text');
  }

  text = md.render(text || '');

  var url = MDSCommon.findValueByName(data.fields, isCustomLicense ? 'licenseURL' : 'url');

  return '<div class="license-drop">' +
    '<div class="license-drop__title">' + title + '</div>' +
    '<div class="license-drop__text">' + text + '</div>' +
    '<div class="license-drop__footer">' +
    //'  <a class="btn btn-success license-drop__link" href="javascript: void(0);" onclick="openLicense();">See More</a>' +
    '  <a class="btn btn-sm btn-primary license-drop__link" target="_blank" href="' + url + '">' + tr$('open_license_page') + '</a>' +
    '</div>' +
    '</div>';
}

function createLicenseDrop(options) {
  var language = (options.language || getCurrentLanguage() || 'en').toLowerCase();
  var items = document.querySelectorAll(options.selector);
  var ret = [];
  for (var i = 0; i < items.length; i++) {
    var drop = new Drop({
      target: items[i],
      openDelay: options.openDelay || 0,
      content: function() {
        var $target = $(this.target);
        return new Promise(function(resolve, reject) {
          var license = $target.data('license');
          if (license === 'custom') {
            var root = $target.data('root');
            Mydataspace.request('entities.get', {
              root: root,
              path: '',
              fields: ['licenseText', 'licenseURL']
            }).then(function(data) {
              resolve(getLicenseDropContent(data, language, true));
            });
            return;
          }
          Mydataspace.request('entities.get', {
            root: 'licenses',
            path: 'data/' + license
          }).then(function(data) {
            resolve(getLicenseDropContent(data, language));
          });
        });
      },
      classes: 'drop-theme-arrows',
      //position: 'bottom left',
      openOn: 'hover'
    });
    ret.push(drop);
  }
  return ret;
}



/**
 * Controller for pricing page.
 * @param {object} options
 * @param {string} options.textInput
 * @param {string} options.sendButton
 * @param {string} options.modal
 * @param {string} options.errorLabel
 * @param {string} options.sentModal
 * @constructor
 */
function ContactModal(options) {
  this.options = options;
  this.$textInput =  $('#' + options.textInput);
  this.$sendButton = $('#' + options.sendButton);
  this.$modal =      $('#' + options.modal);
  this.textInput =   document.getElementById(options.textInput);
  this.errorLabel =  document.getElementById(options.errorLabel);
  this.$sentModal =  $('#' + options.sentModal);
}

/**
 *
 * @param {boolean} [needClear]
 */
ContactModal.prototype.showModal = function (needClear) {
  if (needClear) {
    this.textInput.value = '';
    this.$sendButton.prop('disabled', false);
    this.$textInput.prop('disabled', false);
    this.textInput.classList.remove('new_comment__textarea--error');
    this.errorLabel.innerText = '';
  }
  this.$modal.modal('show');
};

ContactModal.prototype.send = function () {
  this.$textInput.removeClass('new_comment__textarea--error');

  if (this.$textInput.val().trim() === '') {
    this.$textInput.addClass('new_comment__textarea--error');
    this.errorLabel.innerText = '{{ site.data[page.language].menu.feedback_cant_be_blank }}';
    this.$textInput.focus();
    return;
  }

  this.$sendButton.prop('disabled', true);
  this.$textInput.prop('disabled', true);

  var self = this;

  Mydataspace.request('entities.create', {
    root: self.options.root,
    path: self.options.path + '/' + MDSCommon.guid(),
    fields: [
      {
        name: 'text',
        value: this.$textInput.val().trim(),
        type: 's'
      },
      {
        name: 'rate',
        value: '0',
        type: 'i'
      }
    ]
  }, function () {
    self.$modal.modal('hide');
    self.$sentModal.modal('show');
  }, function (err) {
    self.$sendButton.prop('disabled', false);
    self.$textInput.prop('disabled', false);
    console.log(err);
    self.errorLabel.innerText = err.message;
    self.$textInput.focus();
  });
};

ContactModal.prototype.init = function () {
  var self = this;

  self.$modal.on('shown.bs.modal', function () {
    setTimeout(function() {
      self.$textInput.focus();
    }, 300);
  });

  self.$sendButton.click(function () {
    if (!Mydataspace.isLoggedIn()) {
      Mydataspace.on('login', function () {
        setTimeout(function() {
          self.showModal();
          self.send();
        }, 300);
      });

      self.$modal.modal('hide');
      setTimeout(function() {
        $('#signin_modal').modal('show');
      }, 300);
      return;
    }

    self.send();
  });
};