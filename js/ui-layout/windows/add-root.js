UILayout.windows.addRoot = {
    view: 'ModalDialog',
    id: 'add_root_window',
    width: 350,
    position: 'center',
    modal: true,
    head: STRINGS.ADD_ROOT,
    on: UIControls.getOnForFormWindow('add_root', {
      onShow: function (id) {
        no_items__selectTemplate(STRINGS.default_template, 2);
      }
    }),
    body: {
      view: 'form',
      id: 'add_root_form',
      borderless: true,
      on: {
        onSubmit: function() {
          if (!$$('add_root_form').validate({ disabled: true })) {
            UIControls.removeSpinnerFromWindow('add_root_window');
            return;
          }

          // Send request to create new root entity
          var data = $$('add_root_form').getValues();
          data.path = '';
          data.fields = [];

          var sourceRoot = $('#no_items__template_wrap2').data('root');
          if (sourceRoot && sourceRoot !== 'root') {
            data.sourceRoot = sourceRoot;
            data.sourcePath = '';
          }

          Mydataspace.request('entities.create', data).then(function () {
            return Mydataspace.request('apps.create', {
              name: data.root,
              url: 'https://' + data.root + SITE_SUPER_DOMAIN,
              description: 'Automatically created application for website ' + data.root + SITE_SUPER_DOMAIN + '. Please do not change it'
            });
          }).then(function (app) {
            if (!app || !sourceRoot || sourceRoot === 'root') {
              return;
            }

            return Promise.all([Mydataspace.request('entities.change', {
              root: data.root,
              path: '',
              fields: [{name: 'name', value: '', type: 's'}]
            }), Mydataspace.request('entities.change', {
              root: data.root,
              path: 'website/public_html/js',
              fields: [{
                name: 'client.js',
                value: '//\n' +
                '// This file generated automatically. Please do not edit it.\n' +
                '//\n' +
                '\n' +
                'var MDSWebsite = new MDSClient({\n' +
                '  clientId: \'' + app.clientId + '\',\n' +
                '  permission: \'' + data.root + '\'\n' +
                '}).getRoot(\'' + data.root + '\');\n' +
                'MDSWebsite.connect();',
                type: 'j'
              }]
            }), Mydataspace.request('entities.create', {
              root: data.root,
              path: 'processes/' + MDSCommon.guid(),
              fields: [{
                name: 'type',
                value: 'refreshCache',
                type: 's'
              }, {
                name: 'cachePath',
                value: 'cache',
                type: 's'
              }]
            })]);
          }).then(function (res) {
            $$('add_root_window').hide();
            UIControls.removeSpinnerFromWindow('add_root_window');
          }).catch(function (err) {
            UIControls.removeSpinnerFromWindow('add_root_window');
            switch (err.name) {
              case 'SequelizeValidationError':
                if (err.message === 'Validation error: Validation len failed') {
                  var msg = data.root.length > 10 ? 'Too long root name' : 'Too short root name';
                  $$('add_root_form').elements.root.define('invalidMessage', msg);
                  $$('add_root_form').markInvalid('root', true);
                }
                break;
              case 'SequelizeUniqueConstraintError':
                $$('add_root_form').elements.root.define('invalidMessage', 'Name already exists');
                $$('add_root_form').markInvalid('root', true);
                break;
              default:
                UI.error(err);
                break;
            }
          });
        }
      },
      elements: [
        { view: 'template',
          borderless: true,
          height: 160,
          template: '<div style="margin-bottom: 5px; margin-top: -5px;">' + STRINGS.select_template_label + '</div>' +
          '<div id="no_items__template_wrap2" class="no_items__template_wrap" onclick="no_items__initTemplates(2)">\n' +
          '  <div id="no_items__template2" class="snippet__overview snippet__overview--no-margin">\n' +
          '    <img id="no_items__template_img2" class="snippet__image"  />\n' +
          '    <div class="snippet__info" style="padding-bottom: 0">\n' +
          '      <div id="no_items__template_title2" class="snippet__title"></div>\n' +
          '      <div id="no_items__template_description2" class="snippet__description snippet__description--full"></div>\n' +
          // '      <div id="no_items__template_tags2" class="snippet__tags"></div>\n' +
          '    </div>\n' +
          '  </div>\n' +
          '</div>'
        },
        { view: 'text', id: 'NAME_LABEL', label: STRINGS.NAME, required: true, name: 'root', labelWidth: UIHelper.LABEL_WIDTH },
        UIControls.getRootTypeSelectTemplate(),
        UIControls.getSubmitCancelForFormWindow('add_root')
      ]
    }
};
