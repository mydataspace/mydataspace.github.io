UI = {

  setCurrentId: function (id) {
    UI.entityTree.setCurrentId(id);
    UI.entityList.setCurrentId(id);
    UI.entityForm.setCurrentId(id);
  },

  /**
   * @type {EntityForm}
   */
  entityForm: new EntityForm(),

  entityList: new EntityList(),

  entityTree: new EntityTree(),

  pages: new Pages(),

  setMode: function (mode) {
    if (['dev', 'cms'].indexOf(mode) === -1) {
      throw new Error('Illegal mode: ' + mode);
    }

    if (UI.getMode() === mode) {
      return;
    }

    var scriptEditor = $$('script_editor');
    var tabIds = scriptEditor.getTabIds();
    for (var i = tabIds.length - 1; i >= 0; i--) {
      scriptEditor.removeView(tabIds[i]);
    }

    window.localStorage.setItem('uiMode', mode);
    UI.entityForm.setEditing(false);
    UI.entityForm.refresh();
    UI.refresh();
  },

  getMode: function () {
    return window.localStorage.getItem('uiMode') || 'dev';
  },

  VISIBLE_ON_SMALL_SCREENS: [
    'SIGN_OUT_LABEL'
  ],

  updateLanguage: function(newLanguage) {
    var currentLang;
    if (newLanguage) {
      currentLang = newLanguage.toUpperCase();
      if (window.localStorage) {
        window.localStorage.setItem('language', currentLang);
      }
    } else {
      var languageMatch = window.location.pathname.match(/^\/(\w\w)(\/.*)?$/);
      if (languageMatch) {
        currentLang = languageMatch[1].toUpperCase();
      } else {
        currentLang = (window.localStorage && window.localStorage.getItem('language')) || 'EN';
      }
    }

    var strings = STRINGS_ON_DIFFERENT_LANGUAGES[currentLang];

    // Language switcher

    // for (var lang in STRINGS_ON_DIFFERENT_LANGUAGES) {
    //   var langButton = $$('menu__language_button_' + lang.toLowerCase());
    //   if (lang === currentLang) {
    //     webix.html.addCss(langButton.getNode(), 'menu__language_button--selected');
    //   } else {
    //     webix.html.removeCss(langButton.getNode(), 'menu__language_button--selected');
    //   }
    // }

    // Labels

    for (var key in strings) {

      // Must me in upper case
      if (key !== key.toUpperCase()) {
        continue;
      }

      // Value must be string
      if (typeof strings[key] !== 'string') {
        continue;
      }

      var label = $$(key + '_LABEL');
      if (label == null) {
        continue;
      }

      var i = 1;
      while (label != null) {
        var leftPart = strings[key].split('<span')[0];
        var rightPartIndex = label.data.label.indexOf('<span');
        var rightPart = rightPartIndex >= 0 ? label.data.label.substring(rightPartIndex) : '';
        label.define('label', leftPart + rightPart);
        label.refresh();
        label = $$(key + '_LABEL_' + i);
        i++;
      }
    }

    // Side Menu
    var menuItemList = $$('menu__item_list');
    var menuItemListSelectedId = menuItemList.getSelectedId();
    var data = [
      { id: 'data', value: strings.MY_DATA, icon: 'database' },
      { id: 'apps', value: strings.MY_APPS, icon: 'cogs' },
      { id: 'logout', value: strings.SIGN_OUT, icon: 'sign-out' }
    ];
    menuItemList.clearAll();
    for (var i in data) {
      menuItemList.add(data[i]);
    }
    menuItemList.select(menuItemListSelectedId);


    // Dialogs
    var dialogs = ['ADD_ROOT', 'ADD_ENTITY', 'ADD_FIELD', 'ADD_VERSION', 'ADD_WEBSITE'];
    for (var i in dialogs) {
      var dialogId = dialogs[i];
      var dialog = $$(dialogId.toLowerCase() + '_window');
      dialog.getHead().define('template', strings[dialogId]);
      dialog.getHead().refresh();
      $$(dialogId.toLowerCase() + '_window__create_button').setValue(strings.CREATE);
      $$(dialogId.toLowerCase() + '_window__cancel_button').setValue(strings.CANCEL);
    }

    // Comboboxes

    // Others

    $$('entity_form__fields_title').define('template', strings.FIELDS);
    $$('entity_form__fields_title').refresh();

    $$('entity_list__search').define('placeholder', strings.SEARCH);
    $$('entity_list__search').refresh();

    // Override URL

    var a = document.createElement('a');
    a.href = window.location.href;
    var pathname = a.pathname.indexOf('/') === 0 ? a.pathname.substring(1) : a.pathname;
    var index = pathname.indexOf('/');
    if (index < 0) {
      index = pathname.length;
    }
    var firstPart = pathname.substring(0, index);
    if (!(firstPart.toUpperCase() in STRINGS_ON_DIFFERENT_LANGUAGES)) {
      index = 0;
    }

    var newLang = currentLang.toLowerCase() === 'en' ? '' : currentLang.toLowerCase();
    var pathWithoutLanguage = pathname.substring(index);
    if (pathWithoutLanguage.indexOf('/') !== 0) {
      pathWithoutLanguage = '/' + pathWithoutLanguage;
    }
    a.pathname = newLang === '' ? pathWithoutLanguage : '/' + newLang + pathWithoutLanguage;
    if (a.pathname[a.pathname.length - 1] !== '/') {
      a.pathname += '/';
    }
    history.replaceState(
      {},
      document.getElementsByTagName("title")[0].innerHTML,
      a.href);

    // Change logo link
    document.getElementById('logo_link').href = '/' + newLang;




    // No items
    for (var no_item_id in strings.no_items) {
      var noItemsHTML;
      if (Array.isArray(strings.no_items[no_item_id])) {
        noItemsHTML = '<ul class="no_items__notice_list">';
        for (var i in strings.no_items[no_item_id]) {
          noItemsHTML += '<li>' + strings.no_items[no_item_id][i] + '</li>';
        }
        noItemsHTML += '</ul>';
      } else {
        noItemsHTML = strings.no_items[no_item_id];
      }
      var item = document.getElementById(no_item_id);
      if (item) {
        item.innerHTML = noItemsHTML;
      }
    }
  },

  /**
   * Notify user about error.
   * @param err Object in format:
   *            { name: 'Exception name', message: 'Error message' }
   *            Error object can also contains next fields:
   *            - errors - array of errors if several errors happens.
   */
  error: function(err) {
    switch (err.name) {
      case 'NotAuthorizedErr':
      case 'NotAuthorized':
        break;
      default:
        var txt = err.message || err.name;
        if (txt) {
          webix.message({ type: 'error', text: txt });
        }
        break;
    }
    console.error(err);
  },

  info: function(message) {
    webix.message({ type: 'info', text: message, expire: 10000 });
  },

  refresh: function() {
    Mydataspace.emit('users.getMyProfile', {});
    UI.pages.refreshPage('apps', true);
    UI.pages.refreshPage('data', true);

    if (UI.getMode() === 'cms') {
      document.getElementById('admin_panel').classList.add('admin_panel--cms');
    } else {
      document.getElementById('admin_panel').classList.remove('admin_panel--cms');
    }
  },

  /**
   * Handler of upload resource-file event for file input.
   * @param fileInput Input file
   * @param root Root for resource
   * @param type Type of resource - avatar, image or file
   * @param done Success upload feedback
   * @param fail Unsuccess upload feedback
   */
  uploadResource: function(fileInput, root, type, done, fail) {
    var formData = new FormData();
    if ((type === 'avatar' || type === 'image') && !fileInput.type.match('image.*')) {
      alert('Only images');
      return;
    }
    formData.append('root', root);
    formData.append('type', type);
    formData.append('file', fileInput);
    $.ajax({
      url: Mydataspace.options.apiURL + '/v1/entities/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      cache: false,
      headers: {
        authorization: 'Bearer ' + localStorage.getItem('authToken')
      }
    }).done(done).fail(fail);
  },

  //
  // Apps
  //
  refreshApps: function() {
    $$('app_list').disable();
    Mydataspace.request('apps.getAll', {}).then(function() {
      $$('app_list').enable();
    }).catch(function(err) {
      $$('app_list').enable();
      UI.error(err);
    });
  },

  appForm_save: function() {
    $$('app_form').disable();
    Mydataspace.request('apps.change', $$('app_form').getValues(), function() {
      $$('app_form').enable();
    }, function(err) {
      $$('app_form').enable();
      UI.error(err);
    });
  },

  appForm_updateToolbar: function() {
    if (!$$('app_form').isDirty()) {
      $$('SAVE_APP_LABEL').disable();
    } else {
      $$('SAVE_APP_LABEL').enable();
    }
  },

  appForm_setClean: function() {
    $$('app_form').setDirty(false);
    UI.appForm_updateToolbar();
    $$('app_form').enable();
  },

  appForm_setData: function(data) {
    $$('app_form').setValues(data);
    UI.appForm_setClean();
  },

  onLogin: function (withHeader) {
    if (isEmptyPathnameIgnoreLanguage(window.location.pathname)) {
      document.getElementById('bootstrap').style.display = 'none';
      document.getElementById('webix').style.display = 'block';
    }
    adminPanel_startWaiting(2000);
    UI.updateSizes();
    UI.refresh();
    if (withHeader) {
      $$('SIGN_IN_LABEL').hide();
      $$('menu_button').show();
    }
    $('#signin_modal').modal('hide');
    UI.entityTree.setReadOnly(false);
  },

  onLogout: function (withHeader) {
    if (!UIHelper.isViewOnly()) {
      document.getElementById('bootstrap').style.display = 'block';
      document.getElementById('webix').style.display = 'none';
    }
    document.getElementById('no_items').style.display = 'none';
    if (withHeader) {
      $$('menu').hide();
      $$('SIGN_IN_LABEL').show();
      $$('menu_button').hide();
    }
    UI.entityTree.setReadOnly(true);
  },

  initConnection: function(withHeader) {
    if (Mydataspace.isLoggedIn()) {
      UI.onLogin(withHeader);
    }
    Mydataspace.on('login', UI.onLogin.bind(null, withHeader));
    Mydataspace.on('logout', UI.onLogout.bind(null, withHeader));

    UI.entityForm.listen();
    UI.entityList.listen();
    UI.entityTree.listen();

    Mydataspace.on('users.getMyProfile.res', function(data) {
      if (MDSCommon.isBlank(data['avatar'])) {
        data['avatar'] = '/images/no_avatar.svg';
      }
      $$('profile').setValues(data);
      $$('profile__authorizations').setValues(data);
    });

    Mydataspace.on('entities.create.res', function() {
      setTimeout(function() {
        UI.pages.updatePageState('data');
      }, 10);
    });

    Mydataspace.on('entities.delete.res', function() {
      setTimeout(function() {
        UI.pages.updatePageState('data');
      }, 10);
    });

    Mydataspace.on('entities.getMyRoots.res', function() {
      setTimeout(function() {
        UI.pages.updatePageState('data');
      }, 10);
    });

    Mydataspace.on('apps.create.res', function(data) {
      $$('add_app_window').hide();
      if ($$('app_list').getItem(data.clientId) == null) {
        $$('app_list').add({
          id: data.clientId,
          value: data.name
        });
      }
      UI.pages.updatePageState('apps');
      $$('app_list').select(data.clientId);
    });

    Mydataspace.on('apps.change.res', function(data) {
      $$('app_form').setValues(data);
      $$('app_form').setDirty(false);
      UI.appForm_setData(data);
    });

    Mydataspace.on('apps.delete.res', function(data) {
      var nextId = $$('app_list').getPrevId(data.clientId) || $$('app_list').getNextId(data.clientId);
      if (nextId != null) {
        $$('app_list').select(nextId);
      }
      if ($$('app_list').getItem(data.clientId)) {
        $$('app_list').remove(data.clientId);
      }
      UI.pages.updatePageState('apps');
    });

    Mydataspace.on('apps.get.res', function(data) {
      UI.appForm_setData(data);
    });

    Mydataspace.on('apps.getAll.res', function(data) {
      var items = data.apps.map(function(x) {
        return {
          id: x.clientId,
          value: x.name
        };
      });
      $$('app_list').clearAll();
      for (var i in items) {
        $$('app_list').add(items[i], -1);
      }
      var firstId = $$('app_list').getFirstId();
      if (firstId !== null) {
        $$('app_list').select(firstId);
      }
      $$('app_list').enable();
      UI.pages.updatePageState('apps');
    });

    Mydataspace.on('apps.err', UI.error);
    Mydataspace.on('entities.err', UI.error);
  },

  /**
   * Initialize UI only once!
   */
  rendered: false,

  render: function(withHeader) {
    if (UI.rendered) {
      return;
    }
    UI.rendered = true;

    //
    // Communication with popup window of script runner.
    window.addEventListener('message', function(e) {
      if (e.data.message === 'getScripts') {
        var entityId = e.data.id ? e.data.id : UI.entityForm.getCurrentId();
        Mydataspace.request('entities.getWithMeta', Identity.dataFromId(entityId)).then(function (data) {
          data.fields.sort(function(a, b) {
            if (a.type === 'j' && b.type !== 'j') {
              return 1;
            } else if (a.type !== 'j' && b.type === 'j') {
              return -1;
            } else if (a.type === 'j' && b.type === 'j') {
              if (a.name === 'main.js') {
                return 1;
              } else if (b.name === 'main.js') {
                return -1;
              }
              return 0;
            }
            return 0;
          });

          e.source.postMessage(MDSCommon.extend(Identity.dataFromId(UI.entityForm.getCurrentId()), { message: 'fields', fields: data.fields }), '*');
        }, function (err) {
          e.source.postMessage(MDSCommon.extend(Identity.dataFromId(UI.entityForm.getCurrentId()), { message: 'error', error: err.message }), '*');
        });
      }
    });


    //
    //
    //

    webix.protoUI({
      name: 'ModalDialog',

      $init: function () {
        this.attachEvent('onHide', function () {
          this.clearShowData();
        });
      },

      /**
       *
       * @param {object} data
       */
      showWithData: function (data) {
        if (data && typeof data !== 'object') {
          throw new Error('Data must be object');
        }
        this._showData_ = data || {};
        this.show();
      },

      getShowData: function () {
        if (!this._showData_) {
          this._showData_ = {};
        }
        return this._showData_;
      },

      clearShowData: function () {
        this._showData_ = {};
      }
    }, webix.ui.window);

    webix.ui(UILayout.popups.fieldIndexed);
    webix.ui(UILayout.popups.fieldType);
    webix.ui(UILayout.popups.searchScope);
    webix.ui(UILayout.popups.newRoot);
    webix.ui(UILayout.popups.newEntity);
    webix.ui(UILayout.popups.newRootVersion);


    webix.ui(UILayout.windows.editScript);
    webix.ui(UILayout.windows.addRoot);
    webix.ui(UILayout.windows.addEntity);
    webix.ui(UILayout.windows.cloneEntity);
    webix.ui(UILayout.windows.addTask);
    webix.ui(UILayout.windows.addProto);
    webix.ui(UILayout.windows.addResource);
    webix.ui(UILayout.windows.addField);
    webix.ui(UILayout.windows.addFile);
    webix.ui(UILayout.windows.renameFile);
    webix.ui(UILayout.windows.addApp);
    webix.ui(UILayout.windows.changeVersion);
    webix.ui(UILayout.windows.addVersion);
    webix.ui(UILayout.windows.addWebsite);
    webix.ui(UILayout.windows.showMedia);
    webix.ui(UILayout.windows.addGenerator);

    webix.ui(MDSCommon.extend(UILayout.entityContextMenu, { id: 'entity_list_menu' }));
    webix.ui(MDSCommon.extend(UILayout.entityContextMenu, { id: 'entity_tree_menu' }));
    webix.ui(MDSCommon.extend(UILayout.entityContextMenu, { id: 'entity_form_menu' }));
    webix.ui(MDSCommon.extend(UILayout.entityContextMenu, { id: 'entity_list_new_menu' }));

    if (!withHeader) {
      UILayout.sideMenu.hidden = true;
      UILayout.sideMenu.height = 100;
    }
    webix.ui(UILayout.sideMenu);


    //
    // Dashboard
    //
    var rows = [];
    if (withHeader) {
      rows.push(UILayout.header);
    }
    rows.push(UILayout.apps);


    var dataPanels = [];
    dataPanels.push(UILayout.entityTree);

    if (window.parent === window && !webix.without_header) {
      dataPanels.push({
        id: 'my_data_panel__resizer_1',
        view: 'resizer'
      });
    }

    dataPanels.push({
      view: 'multiline-tabview',
      css: 'script_editor',
      id: 'script_editor',
      gravity: 0.6,
      tabbar: {
        height: 30,
        hidden: true,
        on: {
          onOptionRemove: function () {
            var tabbar  = $$('script_editor').getTabbar();
            if ($(tabbar.$view).find('.webix_all_tabs > *').length === 1) {
              tabbar.hide();
            }
          }
        }
      },
      cells: [{
        header: '<i class="fa fa-folder" style="margin-right: 5px;"></i> ' + STRINGS.entities_and_files,
        css: 'script_editor__tab',
        body: UILayout.entityList
      }]
    });

    dataPanels.push({
      id: 'my_data_panel__resizer_2',
      view: 'resizer'
    });
    dataPanels.push(UILayout.entityForm);
    rows.push({ id: 'my_data_panel',
      height: window.innerHeight - 46,
      cols: dataPanels
    });

    webix.ui({
      id: 'admin_panel',
      container: 'admin_panel',
      height: webix.without_header ? window.innerHeight - (50 + 85) : window.innerHeight,
      rows: rows
    });

    var entityListNode = $$('entity_list').getNode();
    entityListNode.addEventListener('contextmenu', function (e) {
      for (var i = 0; i < e.path.length; i++) {
        if (e.path[i].classList && e.path[i].classList.contains('webix_list_item')) {
          $$('entity_list').select(e.path[i].getAttribute('webix_l_id'));
          return;
        }
      }
      $$('entity_list').select($$('entity_list').getFirstId());
    });

    $$('entity_list_menu').attachTo(entityListNode);
    $$('entity_tree_menu').attachTo($$('entity_tree'));

    UI.updateSizes();

    setTimeout(function () {
      UI.updateSizes();
    }, 3000);

    webix.event(window, 'resize', function(e) {
      UI.updateSizes();
    });

    window.addEventListener('error', function (e) {
      UI.error(e.error.message);
      return false;
    });

    //function updateTreeSearchScope() {
    //  // if (Router.isRoot() || Router.isFilterByName()) {
    //  //   $$('entity_tree__root_scope').define('icon', 'database');
    //  //   $$('entity_tree__search').setValue(Router.getSearch(true));
    //  // } else if ((Router.isEmpty() || Router.isMe())) {
    //  //   $$('entity_tree__root_scope').define('icon', 'user');
    //  //   $$('entity_tree__search').setValue(Router.getSearch());
    //  // } else {
    //  //   $$('entity_tree__root_scope').define('icon', 'globe');
    //  //   $$('entity_tree__search').setValue(Router.getSearch());
    //  // }
    //  // $$('entity_tree__root_scope').refresh();
    //}
    //updateTreeSearchScope();

    $(window).on('hashchange', function() {
      UI.pages.refreshPage('data', true);
      // updateTreeSearchScope();
    });

    if (withHeader) {
      UI.updateLanguage();
    }

  },

  updateSizes: function() {
    var windowHeight = $(window).height();
    $$('admin_panel').define('height', windowHeight);
    $$('admin_panel').resize();
    $$('my_data_panel').define('height', windowHeight - 50);
    $$('my_data_panel').resize();
  },

  hideAccessToken: function () {
    document.getElementById('profile__access_key_wrap').innerHTML =
      '<a class="profile__access_key_link" href="javascript: void(0)" onclick="return UI.showAccessToken()">' + STRINGS.SHOW_ACCESS_KEY + '</a>';
    clearTimeout(UI.accessTockenTimer);
  },

  showAccessToken: function() {
    Mydataspace.request('users.getMyAccessToken', {}, function(data) {
      document.getElementById('profile__access_key_wrap').innerHTML =
        '<a href="javascript: void(0)" onclick="UI.hideAccessToken();" class="profile__hide_access_key">' + STRINGS.HIDE_ACCESS_KEY + '</a>' +
        '<div id="profile_access_key" class="profile__access_key">' + data.accessToken + '</div>';

      var range = document.createRange();
      range.selectNode(document.getElementById('profile_access_key'));
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);

      UI.accessTockenTimer = setTimeout(function () {
        UI.hideAccessToken();
      }, 30000);
    }, function(err) {
    });
  },

  deleteEntity: function(entityId) {

  },

  showMedia: function (options) {
    UI.mediaToShow = options;
    $$('show_media_window').show();
  }
};
