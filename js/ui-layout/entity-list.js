UILayout.entityList =
{ id: 'my_data_panel__central_panel',
  // gravity: 0.8,
  rows: [
    { view: 'toolbar',
      cols: [
        { view: 'button',
          type: 'icon',
          icon: 'plus',
          id: 'ADD_ENTITY_LABEL', label: STRINGS.ADD_ENTITY,
          width: 80,
          click: function() {
            switch (UIHelper.getEntityTypeByPath(Identity.dataFromId(UI.entityTree.getCurrentId()).path)) {
              case 'resources':
                $$('add_resource_window').show();
                break;
              default:
                $$('add_entity_window').show();
                break;
            }
          }
        },
        { view: 'button',
          type: 'icon',
          icon: 'refresh',
          id: 'REFRESH_LABEL', label: STRINGS.REFRESH,
          width: 100,
          click: function() {
            UI.entityList.refreshData();
          }
        },
        { view: 'search',
          id: 'entity_list__search',
          css: 'entity_list__search',
          align: 'center',
          icon: 'search',
          placeholder: STRINGS.SEARCH_BY_ENTITIES,
          on: {
            onTimedKeyPress: function(code, e) {
              UI.entityList.refreshData();
            },
            onSearchIconClick: function() {
              // $$('entity_list__search').setValue('');
              // UI.entityList.refreshData();
            }
          }
        }
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
