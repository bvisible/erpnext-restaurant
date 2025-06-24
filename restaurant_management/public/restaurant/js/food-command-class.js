class FoodCommand {
  constructor(options) {
    Object.assign(this, options);
    this.rendered = false;
    this.item = null;
    this.make();
    this.render();
    RM.object(this.identifier + this.process_manage.identifier, this);
  }

  make() {
    this.container.append(`<tr data-item="${this.data.identifier}"></tr>`);
  }

  get wrapper() {
    return this.container.find(`[data-item="${this.data.identifier}"]`);
  }

  render() {
    const order_name = this.process_manage.group_items_by_order ? this.data.order_name : this.data.identifier;
    
    const notes = this.data.notes ? `
      <p style="color:orange">
          <svg class="icon icon-sm" style="">
              <use class="" href="#icon-file"></use>
          </svg>
          </span> <strong>${this.data.notes}</strong>
      </p>` : '';
    
    // Build customization details if any
    let customizations = '';
    
    // Check if this item is a customization sub-item
    if (this.data.from_customize === 1) {
      // This is a sub-item, display it differently
      customizations = '<small style="color: #6c757d;"> <span class="fa fa-plus-circle" style="color: #28a745;"></span> Option de </small>';
    } else if (this.data.is_customizable && this.data.sub_items) {
      try {
        const sub_items = JSON.parse(this.data.sub_items);
        const included_items = sub_items.filter(item => item.included === 1);
        
        if (included_items.length > 0) {
          customizations = '<div style="margin-top: 5px;">';
          included_items.forEach(item => {
            customizations += '<div><small style="color: #6c757d;">';
            customizations += '<span class="fa fa-plus-circle" style="color: #28a745; font-size: 16px; margin-right: 5px;"></span>';
            customizations += item.item_code;
            customizations += '</small></div>';
          });
          customizations += '</div>';
        }
      } catch (e) {
        console.error('Error parsing sub_items in food command:', e);
      }
    }
    
    this.wrapper.empty().html(`
        <td>${this.data.item_name}${customizations} ${notes}</td>
        <td><span class="badge bg-danger" style="font-size:16px; color:#fff;">${this.data.qty}</span></td>
    `);

    $(this.process_manage.command_container()).find(`[data-group="${order_name}"]`).removeClass("hide");
  }

  update_title() {
    this.description.val(this.process_manage.table_info(data) + " | " + this.data.short_name);
  }

  execute() {
    if (RM.busy_message()) {
      return;
    }
    RM.working(this.data.next_action_message, false);

    frappeHelper.api.call({
      model: "Restaurant Object",
      name: this.process_manage.table.data.name,
      method: "set_status_command",
      args: {
        identifier: this.data.identifier
      },
      always: () => {
        RM.ready(false, "success");
      },
    });
  }

  remove() {
    delete this.process_manage.items[this.data.identifier];
    this.wrapper.remove();
  }
}