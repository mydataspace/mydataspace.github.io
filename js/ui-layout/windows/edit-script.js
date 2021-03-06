UILayout.editScriptTabs = {
  text: {
    aceMode: 'text',
    icon: 'align-justify',
    label: 'Text'
  },
  md: {
    aceMode: 'markdown',
    icon: 'bookmark',
    label: 'Markdown'
  },
  json: {
    aceMode: 'json',
    icon: 'ellipsis-h',
    label: 'JSON'
  },
  xml: {
    aceMode: 'xml',
    icon: 'code',
    label: 'XML'
  }
};

UILayout.windows.editScript = {
  view: 'ModalDialog',
  id: 'edit_script_window',
  resize: true,
  position: 'center',
  modal: true,
  head: {
    cols:[
      { width: 15 },
      { view: 'label',
        id: 'edit_script_window_title',
        label: ''
      },
      { view: 'button',
        type: 'icon',
        icon: 'times',
        css: 'webix_el_button--right',
        id: 'CLOSE_LABEL', label: STRINGS.CLOSE,
        width: 70,
        click: function() {
          UI.entityForm.hideScriptEditWindow();
        }
      }
    ]
  },
  width: 900,
  height: 600,
  animate: { type: 'flip', subtype: 'vertical' },
  on: {
    onShow: function() {
      UIHelper.setVisible('SAVE_ENTITY_LABEL_1', !this.getShowData().readonly);
      $$('edit_script_window_title').define('label', STRINGS.field + ': ' + this.getShowData().fieldName);
      $$('edit_script_window_title').refresh();

      if (this.getShowData().text != null) {
        $$('edit_script_window__editor').setValue(this.getShowData().text);
        $$('edit_script_window__editor').getEditor().getSession().setUndoManager(new ace.UndoManager());
      } else if (this.getShowData().fieldName) {
        var editScriptFieldId = 'entity_form__' + this.getShowData().fieldName + '_value';
        var value = $$(editScriptFieldId).getValue();
        $$('edit_script_window__editor').setValue(value);
        $$('edit_script_window__editor').getEditor().getSession().setUndoManager(new ace.UndoManager());
        var ext = editScriptFieldId && $$(editScriptFieldId) && editScriptFieldId.match(/\.([\w]+)_value$/);
        if (ext) {
          this.selectEditScriptTab(ext[1], true);
        }
      }
    },
    onHide: function() {
    }
  },

  body: {
    rows: [
      { view: 'toolbar',
        id: 'edit_script_window__toolbar',
        elements: [
          { view: 'richselect',
            width: 150,
            value: 'text',
            options: Object.keys(UILayout.editScriptTabs).map(function (id) {
              var tab = UILayout.editScriptTabs[id];
              return {
                icon: tab.icon,
                value: tab.label,
                id: tab.aceMode
              };
            }),
            on: {
              onChange: function (newv, oldv) {
                var editor = $$('edit_script_window__editor').editor;
                editor.getSession().setMode('ace/mode/' + newv);
              }
            }
          },
          { },
          { view: 'button',
            type: 'icon',
            icon: 'save',
            id: 'SAVE_ENTITY_LABEL_1',
            label: STRINGS.SAVE_ENTITY,
            autowidth: true,
            on: {
              onItemClick: function () {
                var window = $$('edit_script_window');
                var editor = $$('edit_script_window__editor').editor;
                var fieldId = 'entity_form__' + window.getShowData().fieldName + '_value';
                if (fieldId && $$(fieldId)) {
                  $$(fieldId).setValue(editor.getValue());
                }
                UI.entityForm.save();
              }
            }
          },
          { view: 'button',
            type: 'icon',
            icon: 'search',
            id: 'SCRIPT_EDITOR_FIND_LABEL',
            label: STRINGS.SCRIPT_EDITOR_FIND,
            autowidth: true,
            tooltip: 'Ctrl + F',
            on: {
              onItemClick: function () {
                var editor = $$('edit_script_window__editor').editor;
                editor.execCommand('find');
              }
            }
          },
          { view: 'button',
            type: 'icon',
            icon: 'sort-alpha-asc',
            id: 'SCRIPT_EDITOR_REPLACE_LABEL',
            label: STRINGS.SCRIPT_EDITOR_REPLACE,
            autowidth: true,
            tooltip: 'Ctrl + H',
            on: {
              onItemClick: function () {
                var editor = $$('edit_script_window__editor').editor;
                editor.execCommand('replace');
              }
            }
          }
        ]
      },
      { view: 'ace-editor',
        id: 'edit_script_window__editor',
        mode: 'javascript',
        show_hidden: true,
        on: {
          onReady: function(editor) {
            var window = $$('edit_script_window');
            editor.getSession().setTabSize(2);
            editor.getSession().setUseSoftTabs(true);
            editor.setReadOnly(true);
            editor.getSession().setUseWorker(false);
            editor.getSession().setMode('ace/mode/text');
            editor.commands.addCommand({
              name: 'save',
              bindKey: { win: 'Ctrl-S' },
              exec: function(editor) {
                var fieldId = 'entity_form__' + window.getShowData().fieldName + '_value';
                if (fieldId && $$(fieldId)) {
                  $$(fieldId).setValue(editor.getValue());
                }
                UI.entityForm.save();
              }
            });
            editor.on('change', function() {
              var fieldId = 'entity_form__' + window.getShowData().fieldName + '_value';
              if (fieldId && $$(fieldId)) {
                $$(fieldId).setValue(editor.getValue());
              }
            });
          }
        }
      }
    ]
  }
};
