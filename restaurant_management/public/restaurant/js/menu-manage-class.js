class MenuManage extends ObjectManage {
  #items = {};
  menu_items = {};
  title = "Menu Management";
  identifier = "menu-manage";

  constructor(options) {
    super(options);

    this.modal = null;
    this.item_container_name = `items-container-${this.identifier}`;
    this.items_in_menu = RM.menu.items;
    this.init_synchronize();
    this.initialize();
  }

  get items() { return this.#items }

  get container() { return document.getElementById(this.identifier); }

  init_synchronize() {
    /*frappe.realtime.on("pos_profile_update", () => {
      setTimeout(() => {
        this.check_buttons_status();
      }, 0);
    });*/
  }

  reload() {
    if (!this.is_enabled_to_open()) return;
    this.modal.load_data();
  }

  remove() {
    this.close();
    this.modal.remove();
  }

  initialize() {
    if (!this.is_enabled_to_open()) return;

    this.modal = RMHelper.default_full_modal(
      "Menu Management",
      () => {
        this.make();
      }
    );
  }

  is_enabled_to_open() {
    return true;
    /*if (!RM.can_open_order_manage(this.table)) {
      this.close();
      return false;
    }
    return true;*/
  }

  show() {
    if (!this.is_enabled_to_open()) return;
    this.modal.show();
  }

  close() {
    this.modal.hide()
  }

  make() {
    this.make_dom();

    setTimeout(() => {
      this.make_items();
    }, 100);
  }

  is_open() {
    return this.modal.modal.display
  }

  make_dom() {
    this.modal.container.append(this.template());

    this.modal.title_container.empty().append(
      RMHelper.return_main_button(this.title, () => this.modal.hide()).html()
    );
  }

  template() {
    this.items_wrapper = frappe.jshtml({
      tag: 'div',
      properties: {
        id: this.item_container_name,
        class: 'product-list',
        style: "position: relative; height: calc(100% - 80px); overflow: auto;"
        //style: "height: calc(100% - 30px); overflow-y: auto;"
      },
    });

    this.item_type_wrapper = frappe.jshtml({
      tag: 'div',
      properties: {
        class: "item-type-wrapper",
        /*style: "overflow-y: auto; display: flex;"*/
      },
    });

    this.item_parent_wrapper = frappe.jshtml({
      tag: 'div',
      properties: {
        style: "overflow-y: auto; display: flex; padding: 2px;"
      },
    });

    const template = $(`
    <style>
      .item-type-wrapper {
        padding: 2px;
        /*background: var(--dark);*/
      }
    </style>
		<div class="desk" id="${this.identifier}">
      <div class="content-container" style="height:calc(100% - 40px);">
          <div class="tab items">
              ${this.item_type_wrapper.html()}
              ${this.item_parent_wrapper.html()}
              ${this.items_wrapper.html()}
          </div>
      </div>
		</div>`);

    return template;
  }

  make_items() {
    this.#items = new ItemsTree({
      wrapper: $(`#${this.item_container_name}`),
      order_manage: this,
      in_menu: false
    });
  }

  get items() {
    return this.#items?.current_item_manage?.items || [];
  }

  item_template(item) {
    const price_list_rate = format_currency(item.price_list_rate, this.currency);
    const { item_code, item_name, item_image, description, is_customizable } = item;
    const item_title = item_name || item_code;
    const veg = item.item_type === 'Veg';
    item.in_menu = this.items_in_menu.includes(item.item_code);
    
    const buttonAddTemplate = (item) => {
      return `
        <div class="widget-action-item">
          <button class="btn btn-${item.in_menu ? 'danger' : 'success'} btn-sm" style="border-radius: 20px;">
            <i class="fa fa-${item.in_menu ? 'trash' : 'plus'}"></i>
            ${item.in_menu ? "Remove" : "Add"}
          </button>
        </div>
      `
    }

    item.add_in_menu = frappe.jshtml({
      tag: "div",
      properties: {
        class: "widget-action",
        style: "padding: 0; margin: 0; border-radius: 20px;"
      },
      content: buttonAddTemplate(item)
    }).on("click", () => {
      const items = this.items;
      this.set_item_in_menu(item, buttonAddTemplate);
    });

    return frappe.jshtml({
      tag: "div",
      properties: {
        class: "widget widget-shadow shortcut-widget-box",
        style: "padding: 0; margin: 0; border-radius: 20px;"
      },
      content: template()
    }).html()

    function template() {
      return `
        <div
          class="small-box item item-code"
          item-code="${item_code}" is-customizable=${is_customizable} style="border-radius: 5px 20px 25px; width: 100%;">
            <div class="inner" style="position: inherit; z-index: 100">
                <h4 class="title">
                    <i class="fa fa-circle" style="color: var(--${
                      veg ? "success" : "danger"
                    })"></i>
                    ${item_title}
                </h4>
                <p> ${description}</p>
            </div>
            <div class="icon bg-transparent" style="border-radius: 20px;">
                ${
                  item_image
                    ? `<img src="${item_image}" alt="${item_title}" loading="lazy" decoding="async"></img>`
                    : `<span class="no-image placeholder-text" style="font-size: 40px; color:var(--gray);"> ${frappe.get_abbr(
                        item_title
                      )}</span>`
                }
            </div>
            <div class="small-box-footer" style="padding:3px; background-color: transparent;">
                <div class="form-group" style="position: absolute;">
                    ${item.add_in_menu.html()}
                </div>
                <a class="btn btn-secondary" style="float:right; border-radius:50px;">
                    ${price_list_rate}
                </a>
            </div>
        </div>`;
    }
  }

  set_item_in_menu(item, buttonAddTemplate) {
    const items = this.items;
    const current = items.find(i => i.item_code === item.item_code);
    
    RM.call("set_item_in_menu", {
      item_code: item.item_code,
      in_menu: !current.in_menu
    }).then(r => {
      if (r) {
        item.in_menu = !current.in_menu;
        item.add_in_menu.val(buttonAddTemplate(item));
      }
    });
  }

  storage() {
    return this.#items;
  }
}