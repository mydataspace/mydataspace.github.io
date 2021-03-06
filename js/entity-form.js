/**
 * @class
 */
function EntityForm() {
  var self = this;
  self.editing = false;
  self.loadedListeners = [];


  window.addEventListener('message', function (e) {
    if ([
      'MDSWizard.upload',
      'MDSWizard.getFields',
      'MDSWizard.getData',
      'MDSWizard.save'
    ].indexOf(e.data.message) == -1) {
      return;
    }

    var formData = Identity.dataFromId(self.getCurrentId());
    var iframeWindow = (document.getElementById('entity_form_iframe') || {}).contentWindow;
    switch (e.data.message) {
      case 'MDSWizard.upload':
        $$('add_resource_window').showWithData({
          callback: function (res, err) {
            if (err) {
              iframeWindow.postMessage({
                message: 'MDSWizard.upload.err',
                error: err
              }, '*');
              return;
            }

            iframeWindow.postMessage({
              message: 'MDSWizard.upload.res',
              name: res.resources[0]
            }, '*');
          }
        });
        break;
      case 'MDSWizard.getData':
        break;
      case 'MDSWizard.getFields':
        Mydataspace.entities.get(formData).then(function (data) {
          iframeWindow.postMessage({
            message: 'MDSWizard.getFields.res',
            fields: data.fields,
            path: data.path,
            root: data.root
          }, '*');
        }).catch(function (err) {
          iframeWindow.postMessage({ message: 'MDSWizard.getFields.err', error: err }, '*');
        });

        break;

      case 'MDSWizard.save':
        if (!e.data.token || e.data.token !== self.saveToken) {
          throw new Error('Invalid save token');
        }
        delete self.saveToken;

        var iframeLock = document.getElementById('entity_form_iframe_lock');
        iframeLock.style.display = 'block';
        Mydataspace.request('entities.change', {
          root: formData.root,
          path: formData.path,
          fields: e.data.fields
        }).then(function () {
          iframeLock.style.display = 'none';
        }).catch(function (err) {
          iframeLock.style.display = 'none';
          iframeWindow.postMessage({ message: 'MDSWizard.save.err', token: e.data.token, error: err }, '*');
        });
        break;
    }
  });
}

EntityForm.prototype.onLoaded = function(listener) {
  this.loadedListeners.push(listener);
};

EntityForm.prototype.emitLoaded = function(data) {
  this.loadedListeners.forEach(function(listener) {
    listener(data);
  });
};

/**
 * Switch Entity Form to edit/view mode.
 */
EntityForm.prototype.setEditing = function(editing) {
  if (this.currentId == null) {
      return;
  }

  this.editing = editing;
  delete self.saveToken;

  UI.entityForm.hideScriptEditWindow();
  var entityType = UIHelper.getEntityTypeByPath(Identity.dataFromId(this.currentId).path);

  UIHelper.setVisible('entity_form__toolbar', editing);
  UIHelper.setVisible(['SAVE_ENTITY_LABEL', 'CANCEL_ENTITY_LABEL', 'ADD_FIELD_LABEL'], editing);

  if (editing) {
    webix.html.addCss($$('edit_script_window__toolbar').getNode(), 'entity_form__toolbar--edit');
    webix.html.addCss($$('entity_form__toolbar').getNode(), 'entity_form__toolbar--edit');
    $$('edit_script_window__editor').getEditor().setReadOnly(false);
  } else {
    webix.html.removeCss($$('edit_script_window__toolbar').getNode(), 'entity_form__toolbar--edit');
    webix.html.removeCss($$('entity_form__toolbar').getNode(), 'entity_form__toolbar--edit');
    $$('edit_script_window__editor').getEditor().setReadOnly(true);
  }
};

EntityForm.prototype.isEditing = function() {
  return this.editing;
};

EntityForm.prototype.listen = function() {
  var self = this;
  Mydataspace.on('entities.delete.res', function() {
    $$('entity_form').disable();
  });
  Mydataspace.on('entities.change.res', function(data) {
    if (self.isEditing()) {
      return;
    }
    if (Identity.idFromData(data) !== self.getCurrentId()) {
      return;
    }
    if (MDSCommon.isBlank(data.path)) {
      self.setViewTitle(MDSCommon.findValueByName(data.fields, 'name') || MDSCommon.getEntityName(data.root));
    }
  });
};

EntityForm.prototype.isProto = function() {
  return UIHelper.isProto(this.currentId);
};

EntityForm.prototype.getCurrentId = function () {
  return this.currentId;
};

EntityForm.prototype.setCurrentId = function(id) {
  if (this.currentId === id) {
    return;
  }
  this.currentId = id;
  UI.entityForm.hideScriptEditWindow();
  this.refresh();
};


EntityForm.prototype.setLogRecords = function(fields, ignoredFieldNames, addLabelIfNoFieldsExists) {
  if (!Array.isArray(ignoredFieldNames)) {
    ignoredFieldNames = [];
  }
  if (addLabelIfNoFieldsExists == null) {
    addLabelIfNoFieldsExists = true;
  }
  var viewFields = document.getElementById('view__fields');
  if (MDSCommon.isBlank(fields.filter(function (field) { return field.name.indexOf('$') != 0; }))) {
    viewFields.innerHTML =
      addLabelIfNoFieldsExists ?
      '<div class="view__no_fields_exists">' + STRINGS.NO_FIELDS + '</div>' :
      '';
  } else {
    viewFields.innerHTML = '';
    var numberOfChildren = 0;
    for (var i in fields) {
      var field = fields[i];
      if (ignoredFieldNames.indexOf(field.name) >= 0) {
        continue;
      }
      numberOfChildren++;
      var html = MDSCommon.textToHtml(field.value);
      var status = field.name.split('_')[1];
      var recordClass = 'view__log_record--' + status;
      if (MDSCommon.isBlank(html)) {
        switch (status) {
          case 'success':
            html = 'Script executed successfully';
            break;
          case 'fail':
            html = 'Script failed';
            break;
        }
      }
      var divFd = $('<div class="view__log_record ' + recordClass + '">' +
                        html +
                    '</div>').appendTo(viewFields);
    }
  }
  if (numberOfChildren === 0) {
    viewFields.innerHTML =
      addLabelIfNoFieldsExists ?
      '<div class="view__no_fields_exists">' + STRINGS.NO_FIELDS + '</div>' :
      '';
  }
  return viewFields;
};

EntityForm.getNoFieldsLabel = function(data) {
  return '<div class="view__no_fields_exists">' + STRINGS.NO_FIELDS + '</div>';
};


EntityForm.prototype.setViewFields = function(data,
                                              ignoredFieldNames,
                                              addLabelIfNoFieldsExists,
                                              comparer,
                                              classResolver) {

  var fields = data.fields.filter(function (field) { return field.name.indexOf('.') === -1; });

  if (!Array.isArray(ignoredFieldNames)) {
    ignoredFieldNames = [];
  }
  if (addLabelIfNoFieldsExists == null) {
    addLabelIfNoFieldsExists = true;
  }
  var viewFields = document.getElementById('view__fields');
  if (MDSCommon.isBlank(fields.filter(function (field) { return field.name !== 'description' && field.name.indexOf('$') != 0; }))) {
    viewFields.classList.add('view__fields--empty');
    viewFields.innerHTML = addLabelIfNoFieldsExists ? EntityForm.getNoFieldsLabel(data) : '';
  } else {
    viewFields.classList.add('view__fields--filled');
    viewFields.innerHTML = '';
    var numberOfChildren = 0;
    if (comparer) {
        fields.sort(comparer);
    }
    for (var i in fields) {
      var field = fields[i];
      if (field.name.indexOf('$') !== -1 ||
        ignoredFieldNames.indexOf(field.name) >= 0 ||
        MDSCommon.isBlank(data.path) && UIConstants.ROOT_FIELDS.indexOf(field.name) >= 0 && MDSCommon.isBlank(field.value)) {
        continue;
      }
      numberOfChildren++;
      var html = MDSCommon.textToHtml(field.value);
      var multiline = html.indexOf('\n') >= 0;
      var multilineClass = multiline ? 'view__field_value--multiline' : '';
      var multilineEnd = multiline ? '    <div class="view__field_value__end"></div>\n' : '';
      var fieldClass = classResolver ? classResolver(field) : '';
      var divFd = $('<div class="view__field ' + fieldClass + '">\n' +
                    '  <div class="view__field_name">\n' +
                    '    <div class="view__field_name_box">\n' +
                           field.name +
                    '    </div>\n' +
                    '  </div>\n' +
                    '  <div class="view__field_value ' + multilineClass + '">\n' +
                    '    <div class="view__field_value_box">\n' +
                           (MDSCommon.isPresent(field.value) ? html : '&mdash;') +
                    '    </div>\n' +
                         multilineEnd +
                    '  </div>\n' +
                    '</div>').appendTo(viewFields);
      if (multiline) {
        divFd.data('value', field.value);
      }
    }
  }
  if (numberOfChildren === 0) {
    viewFields.innerHTML = addLabelIfNoFieldsExists ? EntityForm.getNoFieldsLabel(data) : '';
  }
  return viewFields;
};

EntityForm.prototype.startEditing = function () {
  var self = this;
  self.setEditing(true);
  self.refresh();
};

EntityForm.prototype.setViewTitle = function (title) {
  var viewTitle = document.getElementById('view__title');
  viewTitle.innerText = title;
  viewTitle.innerHTML += '<i style="margin-left: 5px;" class="fa fa-caret-down"></i>';
  viewTitle.addEventListener('click', function () { $$('entity_form_menu').show(this) });
};

EntityForm.prototype.clearTimeouts = function () {
  if (this.viewWebsiteLinkDisabledTimeout) {
    clearTimeout(this.viewWebsiteLinkDisabledTimeout);
    delete this.viewWebsiteLinkDisabledTimeout;
  }
  if (this.viewWebsiteLinkDisabledCountdown) {
    clearTimeout(this.viewWebsiteLinkDisabledCountdown);
    delete this.viewWebsiteLinkDisabledCountdown;
  }
};


EntityForm.prototype.setRootView = function(data) {
  var self = this;
  var language = (getCurrentLanguage() || 'en').toLowerCase();
  var languagePrefix = language === 'en' ? '' : '/' + language;

  self.clearTimeouts();

  $.ajax({ url: languagePrefix + '/fragments/root-view.html', method: 'get' }).then(function(html) {
    var view = document.getElementById('view');
    var description = MDSCommon.findValueByName(data.fields, 'description');
    var readme = MDSCommon.findValueByName(data.fields, 'readme');


    var tags = (MDSCommon.findValueByName(data.fields, 'tags') || '').split(' ').filter(function(tag) {
      return tag != null && tag !== '';
    }).map(function(tag) {
      return '<a class="view__tag" href="search?q=%23' + tag + '" target="_blank">' + tag + '</a>';
    }).join(' ');


    var languageAbbr = MDSCommon.findValueByName(data.fields, 'language');
    var countryAbbr = MDSCommon.findValueByName(data.fields, 'country');
    var category = MDSCommon.findValueByName(data.fields, 'category');
    var country = COUNTRIES[countryAbbr];
    var language = COUNTRIES[languageAbbr];

    if (category) {
      tags = '<span class="view__tag"><i class="view__tag_icon fa fa-' + CATEGORY_ICONS[category] + '"></i><span>' + tr$('categories.' + category) + '</span></span> ' + tags;
    }

    if (country && (languageAbbr === countryAbbr || (language.same || []).indexOf(countryAbbr) != -1)) {
      tags = '<span class="view__tag view__tag--flag view__tag--multi_link">' +
        '<img class="view__tag_icon view__tag_icon--flag" src="/images/square_flags/' + country.name + '.svg" />' +
        '<span class="view__tag_link">' +
        tr$('languagesShort.' + languageAbbr) + '</span> / ' +
        '<span class="view__tag_link">' +
        tr$('countries.' + countryAbbr) + '</span></span> ' + tags;
    } else {
      if (country) {
        tags = '<span class="view__tag view__tag--flag">' +
          '<img class="view__tag_icon view__tag_icon--flag" src="/images/square_flags/' + country.name + '.svg" />' +
          tr$('countries.' + countryAbbr) + '</span> ' + tags;
      }
      if (language) {
        tags = '<span class="view__tag view__tag--flag">' +
          '<img class="view__tag_icon view__tag_icon--flag" src="/images/square_flags/' + language.name + '.svg" />' +
          tr$('languagesShort.' + languageAbbr) + '</span> ' + tags;
      }
    }

    var license = MDSCommon.findValueByName(data.fields, 'license');
    if (MDSCommon.isPresent(license)) {
      var licenseOrig = license;
      license = getLicenseWithoutVersion(license);

      if (license !== 'none') {
        tags = '<span class="view__tag view__tag--license' +
          ' data-license="' + licenseOrig + '"' +
          ' data-root="' + data.root + '"' +
          '><i class="view__tag_icon fa fa-balance-scale"></i>' + tr$('licenses.' + licenseOrig) + '</span> ' + tags;
      }
    }


    view.innerHTML = html;

    var ava = MDSCommon.findValueByName(data.fields, 'avatar');
    if (MDSCommon.isPresent(ava)) {
      ava = Mydataspace.options.cdnURL + '/avatars/sm/' + ava + '.png';
    }
    document.getElementById('view__overview_image').src = ava || '/images/icons/root.svg';

    self.setViewTitle(MDSCommon.findValueByName(data.fields, 'name') || MDSCommon.getEntityName(data.root));

    UIHelper.setInnerContentOrRemove('view__tags', tags, 'html');

    if ((data.children || []).filter(function (child) { return child.path === 'website' }).length > 0) {
      var websiteLink = document.getElementById('view__website_link');
      websiteLink.href = 'https://' + data.root + SITE_SUPER_DOMAIN;
      websiteLink.classList.remove('hidden');
      websiteLink.setAttribute('data-root', data.root);
    }

    if (MDSCommon.isBlank(description) && MDSCommon.isBlank(tags)) {
      document.getElementById('view__description').innerHTML = '<i>' + STRINGS.NO_README + '</i>';
    } else {
      document.getElementById('view__description').innerText = description;
      UIHelper.setInnerContentOrRemove('view__description', description);
    }

    // TODO: Uncomment for skeletons
    // document.getElementById('view__counters_likes_count').innerText =
    //   MDSCommon.findValueByName(data.fields, '$likes');
    // document.getElementById('view__counters_comments_count').innerText =
    //   MDSCommon.findValueByName(data.fields, '$comments');

    UIHelper.setInnerContentOrRemove('view__readme', md.render(readme || ''), 'html');

    var viewFields = self.setViewFields(data,
                                        UIConstants.INVISIBLE_ROOT_FIELDS,
                                        false);

    if (viewFields.childNodes.length === 0) {
      viewFields.parentNode.removeChild(viewFields);
    }

    $(viewFields).on('click', '.view__field', function() {
      $(viewFields).find('.view__field--active').removeClass('view__field--active');
      $(this).addClass('view__field--active');
      var value = $(this).data('value');
      UI.entityForm.showScriptViewWindow(value);
    });

    data.children.forEach(function (child) {
      switch (child.path) {
        case 'statistics':
          document.getElementById('view_stat_website_visits_month').innerText =
            MDSCommon.humanizeNumber(MDSCommon.findValueByName(child.fields, 'websiteVisitsTotal') || 0);
          document.getElementById('view_stat_website_visitors_month').innerText =
            MDSCommon.humanizeNumber(MDSCommon.findValueByName(child.fields, 'websiteVisitorsTotal') || 0);
          document.getElementById('view_stat_api_calls_month').innerText =
            MDSCommon.humanizeNumber(MDSCommon.findValueByName(child.fields, 'apiCallsTotal') || 0);
          document.getElementById('view_stat_users_month').innerText =
            MDSCommon.humanizeNumber(MDSCommon.findValueByName(child.fields, 'userRegsTotal') || 0);
          break;
      }
    });
  });
};

EntityForm.prototype.setTaskView = function(data) {
  var self = this;
  var language = (getCurrentLanguage() || 'en').toLowerCase();
  var languagePrefix = language === 'en' ? '' : '/' + language;

  self.clearTimeouts();

  $.ajax({ url: languagePrefix + '/fragments/task-view.html', method: 'get' }).then(function(html) {
    var view = document.getElementById('view');
    view.innerHTML = html;
    document.getElementById('view__overview_icon').className =
      'view__overview_icon fa fa-' +
      UIHelper.getIconByPath(data.path,
                             data.numberOfChildren === 0,
                             false);

    self.setViewTitle(MDSCommon.getEntityName(data.path));

    var viewFields =
        this.setViewFields(data,
                           ['status', 'statusText', 'interval'],
                           false,
                           function(x, y) {
                             if (x.name === 'main.js') {
                                 return 1;
                             }
                             if (y.name === 'main.js') {
                               return -1;
                             }
                             var isScriptX = /.*\.js$/.test(x.name);
                             var isScriptY = /.*\.js$/.test(y.name);
                             if (isScriptX && isScriptY || !isScriptX && !isScriptY) {
                                 if (x < y) {
                                     return -1;
                                 } else if (x.name > y.name) {
                                     return 1;
                                 } else {
                                     return 0;
                                 }
                             } if (isScriptX) {
                                 return 1;
                             } else {
                                 return -1;
                             }
                         }, function(x) {
                           if (x.name === 'main.js') {
                               return 'view__field--script view__field--script--main';
                           }
                           if (/.*\.js$/.test(x.name)) {
                             return 'view__field--script';
                           }
                           return '';
                         });
    var status = MDSCommon.findValueByName(data.fields, 'status');
    if (status != null) {
      var statusClass;
      switch (status) {
        case 'success':
          statusClass = 'view__status--success';
          break;
        case 'fail':
          statusClass = 'view__status--fail';
          break;
      }
      if (statusClass) {
        document.getElementById('view__status').classList.add(statusClass);
      }

      var statusText = MDSCommon.findValueByName(data.fields, 'statusText');
      if (!statusText) {
          switch (status) {
            case 'success':
              statusText = 'Script executed successfully';
              break;
            case 'fail':
              statusText = 'Script failed';
              break;
          }
      }
      document.getElementById('view__status').innerText = statusText;
    }

    var interval = MDSCommon.findValueByName(data.fields, 'interval') || 'paused';
    document.getElementById('view__interval_' + interval).classList.add('view__check--checked');

    $(viewFields).on('click', '.view__field', function() {
      $(viewFields).find('.view__field--active').removeClass('view__field--active');
      $(this).addClass('view__field--active');
      var value = $(this).data('value');
      UI.entityForm.showScriptViewWindow(value);
    });
  }.bind(this));
};

/**
 *
 * @param options
 * @param options.res
 * @param options.data
 * @param options.pageName
 * @param options.host
 * @param options.path
 * @param [options.target]
 */
EntityForm.prototype.setCmsIframe = function (options) {
  var self = this;
  var ok = false;
  for (var i in options.res.fields) {
    if ([options.pageName + '.html', options.pageName + '.pug'].indexOf(options.res.fields[i].name) >= 0) {
      ok = true;
      break;
    }
  }
  if (!ok) {
    throw new Error(options.pageName + '.html not found');
  }
  var url = 'https://' + options.host + options.path + '/' + options.pageName + '.html?' + MDSCommon.guid();
  self.setEntityView(options.data, true).then(function () {
    document.getElementById(options.target ? options.target : 'view__fields').innerHTML = '<iframe id="entity_form_iframe" class="view__iframe" src="' + url + '"></iframe><div id="entity_form_iframe_lock" class="view__iframe_lock"></div>';
  });
};

EntityForm.prototype.setEntityCmsView = function (data) {
  var self = this;

  if (data.path !== 'data' && data.path.indexOf('data/') !== 0) {
    self.setEntityView(data);
    return;
  }

  var host = data.root + '.wiz.fastlix.com';
  var path = data.path.substr('data'.length);
  var wizardsPath = 'website/wizards' + path;

  Mydataspace.entities.get({ root: data.root, path: wizardsPath }).then(function (res) {
    self.setCmsIframe({
      data: data,
      res: res,
      host: host,
      path: path,
      pageName: 'view'
    });
  }).catch(function () {
    return Mydataspace.entities.get({ root: data.root, path: MDSCommon.getParentPath(wizardsPath) });
  }).then(function (res) {
    if (res) {
      self.setCmsIframe({
        data: data,
        res: res,
        host: host,
        path: MDSCommon.getParentPath(path),
        pageName: 'view-item'
      });
    }
  }).catch(function () {
    self.setEntityView(data);
  });
};

EntityForm.prototype.setEntityView = function(data, ignoreFields) {
  var self = this;

  if (self.currentId == null) {
      return;
  }

  self.clearTimeouts();

  var entityType = UIHelper.getEntityTypeByPath(Identity.dataFromId(self.currentId).path);
  var language = (getCurrentLanguage() || 'en').toLowerCase();
  var languagePrefix = language === 'en' ? '' : '/' + language;

  return $.ajax({ url: languagePrefix + '/fragments/entity-view.html', method: 'get' }).then(function(html) {
    var view = document.getElementById('view');
    view.innerHTML = html;
    if (entityType === 'resource') {
      var resourceType = MDSCommon.findValueByName(data.fields, 'type');
      var resourceName = MDSCommon.getPathName(data.path);
      switch (resourceType) {
        case 'avatar':
          document.getElementById('view__overview_icon').parentNode.innerHTML =
            '<img src="' + Mydataspace.options.cdnURL + '/avatars/sm/' + resourceName + '.png" class="view__overview_image" />';
          break;
        case 'image':
          document.getElementById('view__overview_icon').parentNode.innerHTML =
            '<img src="' + Mydataspace.options.cdnURL + '/images/sm/' + resourceName + '.jpg" class="view__overview_image" />';
          break;
        default:
          document.getElementById('view__overview_icon').className =
            'view__overview_icon fa fa-' + UIHelper.getIconByPath(data.path, true, false);
      }
    } else {
      document.getElementById('view__overview_icon').className =
        'view__overview_icon fa fa-' +
        UIHelper.getIconByPath(data.path,
                               data.numberOfChildren === 0,
                               false);
    }

    self.setViewTitle(MDSCommon.getEntityName(data.path));

    if (ignoreFields) {
      return;
    }

    var viewFields = self.setViewFields(data);
    $(viewFields).on('click', '.view__field', function() {
      $(viewFields).find('.view__field--active').removeClass('view__field--active');
      $(this).addClass('view__field--active');
      var value = $(this).data('value');
      var field = $(this).find('.view__field_name').text().trim();
      if (value) {
        UI.entityForm.showScriptViewWindow(value, field);
      }
    });
  });
};

EntityForm.prototype.setLogView = function(data) {
  var self = this;
  var language = (getCurrentLanguage() || 'en').toLowerCase();
  var languagePrefix = language === 'en' ? '' : '/' + language;

  self.clearTimeouts();

  $.ajax({ url: languagePrefix + '/fragments/log-view.html', method: 'get' }).then(function(html) {
    var view = document.getElementById('view');
    view.innerHTML = html;
    document.getElementById('view__overview_icon').className =
      'view__overview_icon fa fa-' +
      UIHelper.getIconByPath(data.path,
                             data.numberOfChildren === 0,
                             false);
    document.getElementById('view__title').innerText =
      MDSCommon.getPathName(data.path);
    var viewFields = self.setLogRecords(data.fields);
    $(viewFields).on('click', '.view__field', function() {
      $(viewFields).find('.view__field--active').removeClass('view__field--active');
      $(this).addClass('view__field--active');
      var value = $(this).data('value');
      UI.entityForm.showScriptViewWindow(value);
    });
  });
};

EntityForm.prototype.setView = function(data) {
  var self = this;

  self.clearTimeouts();

  $('#view').append('<div class="view__loading"></div>');
  if (MDSCommon.isBlank(data.path)) {
    self.setRootView(data);
  } else if (UIHelper.getEntityTypeByPath(data.path) === 'task') {
    self.setTaskView(data);
  } else if (UIHelper.getEntityTypeByPath(data.path) === 'log') {
    self.setLogView(data);
  } else {
    switch (UI.getMode()) {
      case 'dev':
        self.setEntityView(data);
        break;
      case 'cms':
        self.setEntityCmsView(data);
        break;
    }
  }
  $$('entity_form').hide();
  $$('entity_view').show();
};

EntityForm.prototype.setNoFieldLabelVisible = function(visible) {
  var label = $$('NO_FIELDS_LABEL');
  if (!label) {
    return;
  }
  if (visible) {
    label.show();
  } else {
    label.hide();
  }
};

EntityForm.prototype.setCmsData = function(data) {
  var self = this;
  self.clear();

  if (data.path !== 'data' && data.path.indexOf('data/') !== 0) {
    document.getElementById('view').innerHTML = '<div class="view__fields view__fields--empty"><div class="view__no_fields_exists">You can\'t edit this item in CMS mode</div></div>';
    return;
  }

  var host = data.root + '.wiz.fastlix.com';
  var path = data.path.substr('data'.length);
  var wizardsPath = 'website/wizards' + path;

  Mydataspace.entities.get({ root: data.root, path: wizardsPath }).then(function (res) {
    self.setCmsIframe({
      data: data,
      res: res,
      host: host,
      path: path,
      pageName: 'edit'
    });
  }).catch(function () {
    return Mydataspace.entities.get({ root: data.root, path: MDSCommon.getParentPath(wizardsPath) });
  }).then(function (res) {
    if (res) {
      self.setCmsIframe({
        data: data,
        res: res,
        host: host,
        path: MDSCommon.getParentPath(path),
        pageName: 'edit-item',
        target: 'view'
      });
    }
  }).catch(function (err) {
    document.getElementById('view').innerHTML = '<div class="view__fields view__fields--empty"><div class="view__no_fields_exists">You can\'t edit this item in CMS mode</div></div>';
  });

  self.setClean();
  $$('entity_form').hide();
  $$('entity_view').show();
};


EntityForm.prototype.setData = function(data) {
  var formData = {
    name: Identity.nameFromData(data),
    othersCan: data.othersCan,
    maxNumberOfChildren: data.maxNumberOfChildren,
    isFixed: data.isFixed,
    childPrototype: Identity.idFromChildProtoData(data.childPrototype)
  };
  this.clear();
  $$('entity_form').setValues(formData);

  var fields = data.fields.filter(function (field) { return field.name.indexOf('.') === -1; });

  if (MDSCommon.isBlank(data.path)) { // root entity
    // add fields from ROOT_FIELDS if not exists in data.fields
    for (var i in UIConstants.ROOT_FIELDS) {
      var field = UIConstants.ROOT_FIELDS[i];
      if (!MDSCommon.findByName(data.fields, field)) {
        fields.push({ name: field, value: '', type: UIConstants.ROOT_FIELDS_TYPES[field] });
      }
    }

    this.addRootFields({ fields: fields, type: data.type });
  } else {
    this.setNoFieldLabelVisible(true);
    this.addFields(fields, false, UIHelper.getEntityTypeByPath(data.path));
  }
  this.setClean();
  $$('entity_view').hide();
  $$('entity_form').show();
};

EntityForm.prototype.refresh = function() {
  var self = this;

  if (this.currentId == null) {
      return;
  }

  var entityType = UIHelper.getEntityTypeByPath(Identity.dataFromId(self.currentId).path);
  var isWithMeta = self.isEditing();
  $$('entity_form').disable();
  var req = !isWithMeta ? 'entities.get' : 'entities.getWithMeta';
  Mydataspace.request(req, MDSCommon.extend(Identity.dataFromId(self.currentId), { children: true }), function(data) {
    if (!isWithMeta || entityType === 'resource') {
      self.setView(data);
    } else if (UI.getMode() === 'cms') {
      self.setCmsData(data);
      $$('entity_form').enable();
    } else {
      self.setData(data);
      if (self.isProto()) {
        $('.entity_form__first_input').addClass('entity_form__first_input--proto');
        $$('PROTO_IS_FIXED_LABEL').show();
      } else {
        $('.entity_form__first_input').removeClass('entity_form__first_input--proto');
        $$('PROTO_IS_FIXED_LABEL').hide();
      }
      $$('entity_form').enable();
    }
    self.emitLoaded(data);
  }, function(err) {
    UI.error(err);
    $$('entity_form').enable();
  });
};

///**
// * Creates new entity by data received from the 'New Entity' form.
// * @param formData data received from form by method getValues.
// */
//EntityForm.prototype.createByFormData = function(formData) {
//  var newEntityId = Identity.childId(this.currentId, formData.name);
//  var data = Identity.dataFromId(newEntityId);
//  data.fields = [];
//  data.type = formData.type;
//  Mydataspace.emit('entities.create', data);
//};

EntityForm.prototype.export = function () {
  Mydataspace.request('entities.export', Identity.dataFromId(this.currentId));
};

EntityForm.prototype.clone = function(entityId) {
  $$('clone_entity_window').showWithData({ entityId: entityId });
};

EntityForm.prototype.askDelete = function(entityId) {
  webix.confirm({
    title: STRINGS.DELETE_ENTITY,
    text: STRINGS.REALLY_DELETE,
    ok: STRINGS.YES,
    cancel: STRINGS.NO,
    callback: function(result) {
      if (result) {
        UI.entityForm.delete(entityId);
      }
    }
  });
};

EntityForm.prototype.delete = function(entityId) {
  if (entityId == null) {
    entityId = this.currentId;
  }
  if (this.currentId == null) {
    return;
  }

  $$('entity_form').disable();
  UI.deleteEntity(entityId);
  Mydataspace.request('entities.delete', Identity.dataFromId(entityId), function(data) {
    // do nothing because selected item already deleted.
    // this.selectedId = null;
  }, function(err) {
    UI.error(err);
    $$('entity_form').enable();
  });
};

EntityForm.prototype.updateToolbar = function() {
  // if (!$$('entity_form').isDirty()) {
  //   $$('SAVE_ENTITY_LABEL').disable();
  // } else {
  //   $$('SAVE_ENTITY_LABEL').enable();
  // }
};

/**
 * Marks entity form as unchanged.
 */
EntityForm.prototype.setClean = function() {
  $$('entity_form').setDirty(false);
  this.updateToolbar();
  $$('entity_form').enable();
};

/**
 * Marks entity form as changed.
 */
EntityForm.prototype.setDirty = function() {
  $$('entity_form').setDirty(true);
  this.updateToolbar();
};


EntityForm.prototype.save = function() {
	var self = this;

  if (self.currentId == null) {
      return;
  }

  if (UI.getMode() === 'cms') {
    var saveToken = MDSCommon.guid();
    document.getElementById('entity_form_iframe').contentWindow.postMessage({ message: 'MDSWizard.saveRequest', token: saveToken }, '*');
    self.saveToken = saveToken;
    return;
  }

  var dirtyData = webix.CodeParser.expandNames($$('entity_form').getDirtyValues());
  var existingData =
    webix.CodeParser.expandNames(
      Object.keys($$('entity_form').elements).reduce(function(ret, current) {
        ret[current] = '';
        return ret;
      }, {}));
  var oldData = webix.CodeParser.expandNames($$('entity_form')._values);
  MDSCommon.extendOf(dirtyData, Identity.dataFromId(self.currentId));

  dirtyData.fields =
    Fields.expandFields(
      Fields.getFieldsForSave(Fields.expandFields(dirtyData.fields), // dirty fields
                                Object.keys(Fields.expandFields(existingData.fields) || {}), // current exists field names
                                Fields.expandFields(oldData.fields))); // old fields
  $$('entity_form').disable();
  if (typeof dirtyData.childPrototype !== 'undefined') {
    dirtyData.childPrototype = Identity.dataFromChildProtoId(dirtyData.childPrototype);
  }
  Mydataspace.request('entities.change', dirtyData, function(res) {
    if (dirtyData.name != null) {
    	if (Identity.isRootId(self.currentId)) {
				self.selectedId = Identity.idFromData(MDSCommon.extend(res, { root: dirtyData.name }));
			} else {
				self.selectedId = Identity.idFromData(MDSCommon.extend(res, {
					path: MDSCommon.getChildPath(MDSCommon.getParentPath(res.path), dirtyData.name)
				}));
			}
    }
		self.refresh();
    $$('entity_form').enable();
  }, function(err) {
    UI.error(err);
    $$('entity_form').enable();
  });
};

/**
 * Removes all fields from the form.
 */
EntityForm.prototype.clear = function() {
  var rows = $$('entity_form').getChildViews();
  for (var i = rows.length - 1; i >= UIHelper.NUMBER_OF_FIXED_INPUTS_IN_FIELDS_FORM; i--) {
    var row = rows[i];
    if (typeof row !== 'undefined') {
      $$('entity_form').removeView(row.config.id);
    }
  }
};

EntityForm.prototype.addFields = function(fields, setDirty, type) {

  for (var i in fields) {
    var field = fields[i];
    if (field.name.indexOf('$') === 0 || field.name.indexOf('.') >= 0) {
      continue;
    }

    switch (type) {
      case 'task':
        switch (field.name) {
          case 'status':
          case 'statusText':
            break;
          case 'interval':
            this.addTaskIntervalField(field, setDirty);
            break;
          default:
            this.addField(field, setDirty, type === 'proto');
            break;
        }
        break;
      default:
        this.addField(field, setDirty, type === 'proto');
        break;
    }
  }
};

EntityForm.prototype.addRootFields = function(options) {
  var fields = options.fields;
  var setDirty = options.setDirty;
  fields.sort (function(x, y) {
    var xIndex = UIConstants.ROOT_FIELDS.indexOf(x.name);
    var yIndex = UIConstants.ROOT_FIELDS.indexOf(y.name);
    if (xIndex >= 0 && yIndex < 0) {
      return -1;
    }
    if (xIndex < 0 && yIndex >= 0) {
      return 1;
    }
    if (xIndex < 0 && yIndex < 0) {
      if (x.name < y.name) {
        return -1;
      } else if (x.name > y.name) {
        return 1;
      } else {
        return 0;
      }
    }
    if (xIndex < yIndex) {
      return -1;
    } else if (xIndex > yIndex) {
      return 1;
    } else {
      return 0;
    }
  });

  for (var i in fields) {
    var field = fields[i];
    if (field.name.indexOf('$') === 0) {
      continue;
    }

    if (UIConstants.OBSOLETE_ROOT_FIELDS.indexOf(field.name) >= 0) {
      continue;
    }

    // if (options.type === 'd' && UIConstants.HIDDEN_WEBSITE_FIELDS.indexOf(field.name) >= 0) {
    //   continue;
    // }

    if (UIConstants.ROOT_FIELDS.indexOf(field.name) >= 0) {
      this.addRootField(field, setDirty);
    } else {
      this.addField(field, setDirty, false);
    }
  }
};

EntityForm.prototype.onUploadAvatar = function(event) {
  UI.uploadResource(
    event.target.files[0],
    Identity.dataFromId(this.currentId).root,
    'image',
    function(res) {
      var entityName = res.resources[0];
      $$('entity_form__root_avatar_value').setValue(entityName);

      setTimeout(function () {
        $('#entity_form__root_img').prop('src', Mydataspace.options.cdnURL + '/avatars/sm/' + entityName + '.png');
      }, 1000);
    },
    function(err) {
      console.log(err);
    }
  );
};

EntityForm.prototype.addTaskIntervalField = function(data) {
  if (typeof $$('entity_form__' + data.name) !== 'undefined') {
    throw new Error('Field with this name already exists');
  }
  this.setNoFieldLabelVisible(false);
  $$('entity_form').addView(UIControls.getRootFieldView('select', data, STRINGS.intervals), UIHelper.NUMBER_OF_FIXED_INPUTS_IN_FIELDS_FORM);
};

EntityForm.prototype.addRootField = function(data) {
  if (typeof $$('entity_form__' + data.name) !== 'undefined') {
    throw new Error('Field with this name already exists');
  }
  this.setNoFieldLabelVisible(false);
  switch (data.name) {
		case 'avatar':
			$$('entity_form').addView({
				id: 'entity_form__' + data.name,
				css: 'entity_form__field entity_form__field--without-overflow',
				cols: [
					{ view: 'text',
						value: data.name,
						name: 'fields.' + data.name + '.name',
						hidden: true
					},
					{ view: 'text',
						value: data.type,
						id: 'entity_form__' + data.name + '_type',
						name: 'fields.' + data.name + '.type',
						hidden: true
					},
					{ view: 'text',
						value: data.value,
						name: 'fields.' + data.name + '.value',
						id: 'entity_form__root_avatar_value',
						hidden: true
					},
					{
						view: 'label',
						css: 'entity_form__field_label_avatar',
						label: '<div style="visibility: hidden">fake</div>' +
						'<div class="entity_form__field_label">' +
						STRINGS.ROOT_FIELDS[data.name] +
						'</div>' +
						'<div class="entity_form__field_label_ellipse_right"></div>' +
						'<div class="entity_form__field_label_ellipse"></div>',
						width: UIHelper.LABEL_WIDTH,
						height: 38
					},
					{
						borderless: true,
						css: 'entity_form__root_img_template',
						template: '<img id="entity_form__root_img" class="entity_form__root_img" src="' +
						(MDSCommon.isPresent(data.value) ? Mydataspace.options.cdnURL + '/avatars/sm/' + data.value + '.png' : '/images/icons/root.svg') +
						'" alt="Icon" />',
						width: 32
					},
					{ width: 16 },
					{
						borderless: true,
						css: 'entity_form__root_img_upload_template',
						template: '<label class="entity_form__root_img_upload_lbl">' +
						' <input type="file" ' +
						'        onchange="UI.entityForm.onUploadAvatar(event);"' +
						'        required />' +
						' <span>' + STRINGS.ROOT_AVATAR_UPLOAD + '</span>' +
						'</label>'
					},
					{ width: 6 },
					{
						view: 'button',
						label: STRINGS.ROOT_AVATAR_REMOVE,
						id: 'ROOT_AVATAR_REMOVE_LABEL',
						click: function() {
							$$('entity_form__root_avatar_value').setValue('');
							document.getElementById('entity_form__root_img').setAttribute('src', '/images/icons/root.svg');
						}
					}
				]
			});
			break;
    // case 'datasource':
    //   var datasourceInitialOptions = {};
    //   if (MDSCommon.isPresent(data.value)) {
    //     datasourceInitialOptions[data.value] = data.value;
    //   }
    //   $$('entity_form').addView(UIControls.getRootFieldView('select', data, datasourceInitialOptions));
    //   UIHelper.loadDatasourcesToCombo('entity_form__' + data.name + '_value');
    //   break;
    case 'license':
      $$('entity_form').addView(UIControls.getRootFieldView('list', data, STRINGS.licenses));
      break;
		case 'category':
			$$('entity_form').addView(UIControls.getRootFieldView('list', data, STRINGS.categories, CATEGORY_ICONS));
			break;
		case 'language':
			$$('entity_form').addView(UIControls.getRootFieldView('select', data, STRINGS.languages));
			break;
		case 'country':
			$$('entity_form').addView(UIControls.getRootFieldView('select', data, STRINGS.countries));
			break;
    case 'readme':
    case 'licenseText':
      $$('entity_form').addView(UIControls.getRootFieldView('textarea', data));
      break;
		default:
			$$('entity_form').addView(UIControls.getRootFieldView('text', data));
			break;
	}
};

/**
 * Add new field to form.
 * @param {object} data       Data of field
 * @param {boolean} setDirty  Mark form as modified after field added.
 * @param {boolean} isProto   Is field of prototype-entity.
 */
EntityForm.prototype.addField = function(data, setDirty, isProto) {
  var self = this;

  if (typeof $$('entity_form__' + data.name) !== 'undefined') {
    throw new Error('Field with this name already exists');
  }
  this.setNoFieldLabelVisible(false);
  if (typeof setDirty === 'undefined') {
    setDirty = false;
  }
  if (setDirty) {
    var values = webix.copy($$('entity_form')._values);
  }

  $$('entity_form').addView({
    id: 'entity_form__' + data.name,
    css: 'entity_form__field entity_form__field--text',
    cols: [
      { view: 'text',
        value: data.name,
        name: 'fields.' + data.name + '.name',
        hidden: true
      },
      { view: 'text',
        value: data.type,
        id: 'entity_form__' + data.name + '_type',
        name: 'fields.' + data.name + '.type',
        hidden: true
      },
      { view: 'text',
        value: data.indexed,
        id: 'entity_form__' + data.name + '_indexed',
        name: 'fields.' + data.name + '.indexed',
        hidden: true
      },
      { view: data.type === 'j' ? 'textarea' : 'text',
        type: data.type === '*' ? 'password': 'text',
        label: '<div style="visibility: hidden">fake</div>' +
               '<div class="entity_form__field_label">' +
                data.name +
               '</div>' +
               '<div class="entity_form__field_label_ellipse_right"></div>' +
               '<div class="entity_form__field_label_ellipse"></div>',
        labelWidth: UIHelper.LABEL_WIDTH,
        name: 'fields.' + data.name + '.value',
        id: 'entity_form__' + data.name + '_value',
        value: data.type === 'j' ? UIHelper.escapeHTML(data.value) : data.value,
        height: 32,
        css: 'entity_form__text_label',
        readonly: data.type === 'j',
        on: {
          onBlur: function() {
            // if (self.editScriptFieldId == 'entity_form__' + data.name + '_value') {
            //   self.editScriptFieldId = null;
            // }
          },

          onFocus: function() {
            if (data.type === 'j') {
              UI.entityForm.showScriptEditWindow(data.name);
            } else {
              UI.entityForm.hideScriptEditWindow();
            }
          }
        }
      },
      { view: 'button',
        width: 30,
        type: 'iconButton',
        icon: Fields.FIELD_TYPE_ICONS[data.type],
        css: 'entity_form__field_type_button',
        popup: 'entity_form__field_type_popup',
        options: Fields.getFieldTypesAsArrayOfIdValue(),
        id: 'entity_form__' + data.name + '_type_button',
        on: {
          onItemClick: function() {
            self.currentFieldName = data.name;
            $$('entity_form__field_type_popup_list').unselectAll();
          }
        }
      },
      { view: 'button',
        type: 'icon',
        css: 'entity_form__field_delete',
        icon: 'remove',
        width: 10,
        click: function() {
          self.deleteField(data.name);
        }
      },
      { view: 'button',
        width: 10,
        type: 'iconButton',
        icon: !isProto ? null : Fields.FIELD_INDEXED_ICONS[(data.indexed || 'off').toString()],
        css: 'entity_form__field_indexed_button',
        popup: 'entity_form__field_indexed_popup',
        disabled: !isProto,
        id: 'entity_form__' + data.name + '_indexed_button',
        on: {
          onItemClick: function() {
            self.currentFieldName = data.name;
            $$('entity_form__field_indexed_list').unselectAll();
          }
        }
      }
    ]
  });
  if (setDirty) {
    $$('entity_form')._values = values;
    self.updateToolbar();
  }
};

EntityForm.prototype.deleteField = function(name) {
  var values = webix.copy($$('entity_form')._values);
  $$('entity_form').removeView('entity_form__' + name);
  $$('entity_form')._values = values;
  this.setDirty();
  var rows = $$('entity_form').getChildViews();
  if (rows.length === UIHelper.NUMBER_OF_FIXED_INPUTS_IN_FIELDS_FORM) {
    this.setNoFieldLabelVisible(true);
  }
};

EntityForm.prototype.selectEditScriptTab = function (id, hideOthers) {
  Object.keys(UILayout.editScriptTabs).forEach(function (id2) {
    var tab = $$('edit_script_window__toolbar_' + id2 + '_button');
    var classList = tab.getNode().classList;
    if (id == id2) {
      classList.add('webix_el_button--active');
      tab.show();
    } else {
      classList.remove('webix_el_button--active');
      if (hideOthers) {
        tab.hide();
      } else {
        tab.show();
      }
    }
  });
  var editor = $$('edit_script_window__editor').getEditor();
  var editorTab = UILayout.editScriptTabs[id] || UILayout.editScriptTabs['text'];
  editor.getSession().setMode('ace/mode/' + editorTab.aceMode);
  editor.getValue();
};

EntityForm.prototype.showScriptViewWindow = function (text, fieldName) {
  $$('edit_script_window').showWithData({
    text: text,
    readonly: true,
    fieldName: fieldName
  });
};

EntityForm.prototype.showScriptEditWindow = function (fieldName) {
  $$('edit_script_window').showWithData({ fieldName: fieldName });
};

EntityForm.prototype.hideScriptEditWindow = function() {
  $$('edit_script_window').hide();
};