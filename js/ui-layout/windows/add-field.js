UILayout.windows.addField = {
  view: 'ModalDialog',
  id: 'add_field_window',
  width: 300,
  position: 'center',
  modal: true,
  head: STRINGS.ADD_FIELD,
  on: UIControls.getOnForFormWindow('add_field'),
  body: {
    view: 'form',
    id: 'add_field_form',
    borderless: true,
    on: {
      onSubmit: function() {
        if (!$$('add_field_form').validate({ disabled: true })) {
          return;
        }

        UI.entityForm.addField(
          MDSCommon.extend($$('add_field_form').getValues(), { indexed: 'off' }),
          true,
          UIHelper.isProto(UI.entityForm.getCurrentId()));

        setTimeout(function() {
          $$('add_field_window').hide();
        }, 100);

        // setTimeout(function() {
        //   var n = window.localStorage.getItem('dont_forgot_to_save');
        //   if (MDSCommon.isPresent(n) && parseInt(n) > 3) {
        //     return;
        //   } else if (MDSCommon.isInt(n)) {
        //     n = parseInt(n) + 1;
        //   } else {
        //     n = 1;
        //   }
        //   window.localStorage.setItem('dont_forgot_to_save', n.toString());
        //   UI.info(STRINGS.dont_forgot_to_save);
        // }, 600);
      }
    },

    elements: [
      { view: 'text', required: true, id: 'NAME_LABEL_2', label: STRINGS.NAME, name: 'name' },
      MDSCommon.extend(UIControls.getFieldTypeSelectTemplate(), {
        on: {
          onChange: function (newv, oldv) {
            if (newv === '*') {
              $$('VALUE_LABEL').show();
              $$('VALUE_LABEL').define('type', 'password');
              $$('VALUE_LABEL').refresh();
            } else if (oldv === '*') {
              $$('VALUE_LABEL').define('type', 'text');
              $$('VALUE_LABEL').refresh();
            } else if (newv === 'j') {
              $$('VALUE_LABEL').hide();
            } else {
              $$('VALUE_LABEL').show();
            }
          }
        }
      }),
      { view: 'text', id: 'VALUE_LABEL', label: STRINGS.VALUE, name: 'value' },
      UIControls.getSubmitCancelForFormWindow('add_field', false)
    ],

    rules: {
      name: function(value) {
        return /^[\w-]+$/.test(value) && typeof $$('entity_form__' + value) === 'undefined'
      },
      value: function(value) {
        var values = $$('add_field_form').getValues();
        var typeInfo = Fields.FIELD_TYPES[values.type];
        return typeof typeInfo !== 'undefined' && typeInfo.isValidValue(value);
      }
    }
  }
};
