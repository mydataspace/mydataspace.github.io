UILayout.popups.fieldType = {
  view: 'popup',
  id: 'entity_form__field_type_popup',
  css: 'entity_form__field_type_popup',
  width: 130,
  body:{
    view: 'list',
    id: 'entity_form__field_type_popup_list',
    class: 'entity_form__field_type_popup_list',
    borderless: true,
    data: Fields.FIELD_TYPE_LIST,
    datatype: 'json',
    template: '<i class="fa fa-#icon#" style="width: 28px;"></i> #value#',
    autoheight: true,
    select: true,
        on: {
          onItemClick: function(newv) {
            var fieldName = UI.entityForm.currentFieldName;
            var fieldId = 'entity_form__' + fieldName;
            var fieldValue = $$(fieldId + '_value').getValue();
            $$(fieldId + '_type_button').define('icon', Fields.FIELD_TYPE_ICONS[newv]);
            $$(fieldId + '_type_button').refresh();
            var oldv = $$(fieldId + '_type').getValue();
            $$(fieldId + '_type').setValue(newv);
            $$('entity_form__field_type_popup').hide();
            var oldValues = webix.copy($$('entity_form')._values);
            delete oldValues['fields.' + UI.entityForm.currentFieldName + '.value'];
            if (newv === 'j' || oldv === 'j') {
              webix.ui(
                { view: newv === 'j' ? 'textarea' : 'text',
                  label: fieldName,
                  name: 'fields.' + fieldName + '.value',
                  id: 'entity_form__' + fieldName + '_value',
                  value: fieldValue,
                  labelWidth: UIHelper.LABEL_WIDTH,
                  height: 32,
                  css: 'entity_form__text_label',
                  on: {
                    onFocus: function() {
                      if (newv === 'j') {
                        // UI.entityForm.editScriptFieldId = 'entity_form__' + fieldName + '_value';
                        UI.entityForm.showScriptEditWindow('entity_form__' + fieldName + '_value');
                      }
                    }
                  }
                },
                $$('entity_form__' + fieldName),
                $$('entity_form__' + fieldName + '_value')
              );
              switch (newv) {
                //case 'j':
                //  $$('entity_form__' + UI.entityForm.currentFieldName + '_indexed_button').enable();
                //  var fieldIndexed = $$(fieldId + '_indexed').getValue();
                //  $$('entity_form__' + UI.entityForm.currentFieldName + '_indexed_button').define('icon', Fields.FIELD_INDEXED_ICONS[fieldIndexed || 'off']);
                //  $$('entity_form__' + UI.entityForm.currentFieldName + '_indexed_button').refresh();
                //  break;
                case '*':
                  $$('entity_form__' + UI.entityForm.currentFieldName + '_indexed_button').disable();
                  $$('entity_form__' + UI.entityForm.currentFieldName + '_indexed_button').define('icon', Fields.FIELD_INDEXED_ICONS['off']);
                  $$('entity_form__' + UI.entityForm.currentFieldName + '_indexed_button').refresh();

                  $$('entity_form__' + fieldName + '_value').define('type', 'password');
                  $$('entity_form__' + fieldName + '_value').refresh();
                  break;
                default:
                  $$('entity_form__' + UI.entityForm.currentFieldName + '_indexed_button').enable();
                  $$('entity_form__' + UI.entityForm.currentFieldName + '_indexed_button').define('icon', Fields.FIELD_INDEXED_ICONS[fieldIndexed || 'off']);
                  $$('entity_form__' + UI.entityForm.currentFieldName + '_indexed_button').refresh();

                  $$('entity_form__' + fieldName + '_value').define('type', 'text');
                  $$('entity_form__' + fieldName + '_value').refresh();
                  break;
              }
            } else if (newv === '*') {
              $$('entity_form__' + fieldName + '_value').define('type', 'password');
              $$('entity_form__' + fieldName + '_value').refresh();
            } else if (oldv === '*') {
              $$('entity_form__' + fieldName + '_value').define('type', 'text');
              $$('entity_form__' + fieldName + '_value').refresh();
            }
            $$('entity_form')._values = oldValues;
          }
        }
  }
};
