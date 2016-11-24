UILayout.entityList =
{ id: 'my_data_panel__central_panel',
  gravity: 0.8,
  rows: [
    { view: 'toolbar',
      cols: [
        { view: 'button',
          type: 'icon',
          icon: 'plus',
          id: 'ADD_ENTITY_LABEL', label: STRINGS.ADD_ENTITY,
          width: 110,
          click: function() {
            $$('add_entity_window').show();
          }
        },
        // { id: 'entity_list__menu_sep'
        // },
        { view: 'search',
          id: 'entity_list__search',
          css: 'entity_list__search',
          align: 'center',
          // hidden: true,
          // icon: 'close',
          placeholder: STRINGS.SEARCH_BY_ENTITIES,
          on: {
            onKeyPress: function(code, e) {
              if (code === 13 && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                UI.entityList.refreshData();
                return false;
              }
            },
            // onSearchIconClick: function() {
            //   $$('entity_list__search').hide();
            //   $$('entity_list__menu_sep').show();
            //   $$('ENTITY_SEARCH_LABEL').show();
            // }
          }
        },
        // { view: 'button',
        //   type: 'icon',
        //   icon: 'search',
        //   id: 'ENTITY_SEARCH_LABEL',
        //   width: 30,
        //   click: function() {
        //     $$('entity_list__search').show();
        //     $$('entity_list__menu_sep').hide();
        //     $$('ENTITY_SEARCH_LABEL').hide();
        //   }
        // }
      ]
    },
    { view: 'list',
      id: 'entity_list',
      select: true,
      template: function(obj) {
        var icon =
          UIHelper.getIconByPath(Identity.dataFromId(obj.id).path,
                                 obj.count === 0,
                                 false);
        return (obj.id.endsWith(UIHelper.ENTITY_LIST_SHOW_MORE_ID) ? '' :
                  '<div class="entity_list__item_icon fa fa-' + icon + '"></div>') +
               '<div class="entity_list__item">' +
               '<div class="entity_list__item_name">' + obj.value + '</div>' +
               (obj.count == null ? '' :
                 '<div class="entity_list__item_count">' + obj.count + '</div>' +
                 '<div class="entity_list__item_count_prefix fa fa-child"></div>') +
               '</div>';
      },
      on: {
        onBeforeSelect: function(id, selection) {
          if (id.endsWith(UIHelper.ENTITY_LIST_SHOW_MORE_ID)) {
            UI.entityList.showMore();
          } else {
            UI.entityList.setCurrentId(id);
          }
        },
        onSelectChange: function (ids) {
          var id = ids[0];
          if (id.endsWith(UIHelper.ENTITY_LIST_SHOW_MORE_ID)) {
            $$('entity_list').select(UI.entityList.getCurrentId());
          } else {
            UI.entityForm.setSelectedId(id);
          }
        },
        onItemDblClick: function(id) {
          var parentId = Identity.parentId(id);
          if (id === 'root' || parentId === 'root') {
            return;
          }
          UI.entityTree.resolveChildren(parentId).then(function() {
            $$('entity_tree').open(parentId);
            $$('entity_tree').select(id);
          });
        }
      }
    }
  ]
};
