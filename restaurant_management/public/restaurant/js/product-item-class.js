class ProductItem {
  have_search = true;
  items = {};
  currency = RM.pos_profile.currency;
  search_term = '';
  item_type = '';

  constructor(opts) {
    console.log('=== PRODUCT ITEM CONSTRUCTOR ===');
    console.log('Options received:', opts);
    console.log('item_tree:', !!opts.item_tree);
    console.log('order_manage:', !!opts.order_manage);
    
    Object.assign(this, opts);

    this.parent_item_group = this.item_group;
    this.make_dom();
    this.init_clusterize();
    this.load_items_data();
  }

  make_dom() {
    this.wrapper.html(`
			<div class="layout-table" style="height:unset !important;">
				<div class="items-wrapper" style="height: 100%"></div>
			</div>
		`);

    this.items_wrapper = this.wrapper.find('.items-wrapper');
    this.items_wrapper.append(`
			<div class="panel pos-items widget-group " style="height: 100%; margin-bottom:5px;">
        <div class="widget-group-body grid-col-3">
        
        </div>
			</div>
		`);
  }

  init_clusterize() {
    this.clusterize = new Clusterize({
      scrollElem: this.wrapper.find('.panel')[0],
      contentElem: this.wrapper.find('.widget-group-body')[0],
      rows_in_block: 40,
    });
  }

  async load_items_data() {
    this.items = await this.get_items();
    this.items = this.items.items;
    this.all_items = this.items;
    this.render_items();
  }

  get_items({ start = 0, page_length = 400, search_value = this.search_term, item_group = this.parent_item_group } = {}) {
    const price_list = RM.pos_profile.selling_price_list;
    const pos_profile = RM.pos_profile.name;
    const force_parent = 0;
    const item_type = this.item_tree.item_type_filter;

    return new Promise(res => {
      frappe.call({
        method: RM.url_manage + 'get_items',
        freeze: true,
        args: { start, page_length, price_list, item_group, item_type, search_value, pos_profile, force_parent, in_menu: this.item_tree.in_menu }
      }).then(r => {
        res(r.message);
      });
    });
  }

  render_items(items=this.items) {
    console.log('=== RENDER ITEMS CALLED ===');
    console.log('Number of items to render:', items ? Object.keys(items).length : 0);
    console.log('Wrapper exists:', !!this.wrapper);
    
    const self = this;
    items = Object.values(items);

    if (this.item_tree.in_menu) {
      items = items.filter(item => RM.menu.items.includes(item.item_code));
    }

    const raw_items =items
      //.filter(item => {console.log(item); return item.item_group === this.parent_item_group})
      .map(item => this.get_item_html(item));

    raw_items.reduce((acc, item) => acc += item, '');

    this.clusterize.update(raw_items);

    console.log('Items in DOM before attaching events:', this.wrapper.find('.item-code').length);

    // First remove any existing event handlers to prevent duplicates
    this.wrapper.find('.item-code').off('click');
    this.wrapper.find('.minus-btn, .add-btn, .add-item').off('click');
    
    let eventCount = 0;
    this.wrapper.find('.item-code').each(function () {
      const item_code = $(this).attr('item-code');
      const minus_btn = $(this).find('.minus-btn');
      const add_btn = $(this).find('.add-btn');
      const add_qty = $(this).find('.add-qty');
      const is_customizable = !!parseInt($(this).attr('is-customizable'));
      const add_item = $(this).find('.add-item');
      
      eventCount++;

      minus_btn.on('click', (e) => {
        console.log('=== MINUS BUTTON CLICKED ===');
        console.log('Item:', item_code);
        e.stopPropagation();

        const qty = parseInt(add_qty.html());
        console.log('Current qty:', qty);
        qty > 1 && add_qty.html(qty - 1);
      });

      add_btn.on('click', (e) => {
        console.log('=== PLUS BUTTON CLICKED ===');
        console.log('Item:', item_code);
        e.stopPropagation();

        const currentQty = parseInt(add_qty.html());
        console.log('Current qty:', currentQty);
        add_qty.html(currentQty + 1);
      });

      add_item.on('click', (e) => {
        console.log('=== ADD ITEM BUTTON CLICKED ===');
        console.log('Item:', item_code);
        console.log('Is customizable:', is_customizable);
        console.log('Current order:', self.item_tree.order_manage.current_order);
        
        e.stopPropagation();
        const qty = parseInt(add_qty.html());
        console.log('Quantity to add:', qty);

        if (is_customizable) {
          console.log('Opening customization modal...');
          self.show_customization_modal(item_code, qty);
          return;
        }

        console.log('Adding item directly to order...');
        add_qty.html(1);
        self.add_item_in_order(self.get(item_code), qty);
      });
    });
    
    console.log('Event handlers attached to', eventCount, 'items');

    setTimeout(() => {
      const current_order = this.item_tree.order_manage.current_order;
      console.log('Updating items with current order:', !!current_order);
      this.update_items(current_order ? current_order.items : {});
    }, 100);
  }

  reattach_events() {
    console.log('=== REATTACHING EVENTS ===');
    const self = this;
    
    // Remove old handlers first
    this.wrapper.find('.item-code').off('click');
    this.wrapper.find('.minus-btn, .add-btn, .add-item').off('click');
    
    let eventCount = 0;
    this.wrapper.find('.item-code').each(function () {
      const item_code = $(this).attr('item-code');
      const minus_btn = $(this).find('.minus-btn');
      const add_btn = $(this).find('.add-btn');
      const add_qty = $(this).find('.add-qty');
      const is_customizable = !!parseInt($(this).attr('is-customizable'));
      const add_item = $(this).find('.add-item');
      
      eventCount++;

      minus_btn.on('click', (e) => {
        console.log('=== MINUS BUTTON CLICKED (reattached) ===');
        console.log('Item:', item_code);
        e.stopPropagation();

        const qty = parseInt(add_qty.html());
        console.log('Current qty:', qty);
        qty > 1 && add_qty.html(qty - 1);
      });

      add_btn.on('click', (e) => {
        console.log('=== PLUS BUTTON CLICKED (reattached) ===');
        console.log('Item:', item_code);
        e.stopPropagation();

        const currentQty = parseInt(add_qty.html());
        console.log('Current qty:', currentQty);
        add_qty.html(currentQty + 1);
      });

      add_item.on('click', (e) => {
        console.log('=== ADD ITEM BUTTON CLICKED (reattached) ===');
        console.log('Item:', item_code);
        console.log('Is customizable:', is_customizable);
        console.log('Current order:', self.item_tree.order_manage.current_order);
        
        e.stopPropagation();
        const qty = parseInt(add_qty.html());
        console.log('Quantity to add:', qty);

        if (is_customizable) {
          console.log('Opening customization modal...');
          self.show_customization_modal(item_code, qty);
          return;
        }

        console.log('Adding item directly to order...');
        add_qty.html(1);
        self.add_item_in_order(self.get(item_code), qty);
      });
    });
    
    console.log('Events reattached to', eventCount, 'items');
  }

  update_items(items = []) {
    this.wrapper.find('.item-code').each(function () {
      const item = Object.values(items).find(item => item.data.item_code === $(this).attr('item-code'));
      const item_in_cart = $(this).find('.items-in-cart');
      const item_in_cart_qty = item_in_cart.find('.qty-in-cart');

      if (item && item.data.qty > 0) {
        item_in_cart.show();
        item_in_cart_qty.html(item.data.qty);
      } else {
        item_in_cart.hide();
        item_in_cart_qty.html(0);
      }
    });
  }

  async show_customization_modal(item_code, qty) {
    const item = this.get(item_code);

    const customization_items = () => {
      return new Promise(res => {
        frappe.db.get_list("Item Customizable", {
          parent_doctype: "Item",
          fields: ["item", "rate", "qty", "included", "idx"],
          filters: { parent: item_code },
          order_by: "idx asc"  // Order by idx to maintain child table order
        }).then(customization_items => {
          const fields = customization_items.map(item => {
            return {
              customization_item: item.item,
              qty: item.qty,
              rate: item.rate,
              included: item.included,
              idx: item.idx
            }
          });

          res(fields);
        });
      });
    }

    const customization_data = await customization_items();
    
    const modal = new frappe.ui.Dialog({
      title: `${__('Customize')} ${item.item_name}`,
      fields: [
        {
          fieldname: 'customization_html',
          fieldtype: 'HTML'
        }
      ],
      primary_action_label: __('Add to Order'),
      primary_action: () => {
        const customization_items = [];
        modal.$wrapper.find('.customization-item').each(function() {
          const $item = $(this);
          const included = $item.find('.custom-switch input').is(':checked');
          customization_items.push({
            item_code: $item.data('item-code'),
            qty: parseFloat($item.data('qty')),
            rate: parseFloat($item.data('rate')),
            included: included ? 1 : 0
          });
        });
        
        item.is_customizable = 1;
        item.sub_items = JSON.stringify(customization_items);
        console.log("Adding customized item:", item.item_name, "with options:", customization_items.filter(i => i.included).map(i => i.item_code));
        this.add_item_in_order(item, qty);
        modal.hide();
      },
      secondary_action_label: __('Cancel'),
      secondary_action: () => {
        modal.hide();
      }
    });
    
    // Build custom HTML for grid layout
    let html = `
      <style>
        .customization-container {
          max-height: 450px;
          overflow-y: auto;
          padding: 10px;
        }
        .customization-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .customization-item {
          display: flex;
          flex-direction: column;
          padding: 15px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          transition: all 0.2s;
          background-color: var(--card-bg);
          cursor: pointer;
          position: relative;
        }
        .customization-item:hover {
          border-color: var(--primary-color);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .customization-item.selected {
          border-color: var(--primary-color);
          background-color: var(--primary-light);
        }
        .customization-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .customization-name {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-color);
          flex: 1;
          margin-right: 10px;
          line-height: 1.3;
        }
        .customization-details {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 8px;
        }
        .customization-qty {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .customization-rate {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          color: var(--primary-color);
          font-size: 14px;
        }
        .custom-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }
        .custom-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .switch-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .3s;
          border-radius: 24px;
        }
        .switch-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
        .custom-switch input:checked + .switch-slider {
          background-color: var(--primary-color);
        }
        .custom-switch input:checked + .switch-slider:before {
          transform: translateX(20px);
        }
        .no-customization {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
        }
        .price-summary {
          padding: 15px;
          background-color: var(--bg-color);
          border-top: 2px solid var(--border-color);
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .price-label {
          font-weight: 500;
          color: var(--text-color);
        }
        .total-price {
          font-size: 18px;
          font-weight: bold;
          color: var(--primary-color);
        }
      </style>
      <div class="customization-wrapper">
        <div class="customization-container">
          <div class="customization-grid">
    `;
    
    if (customization_data && customization_data.length > 0) {
      customization_data.forEach((custom_item, index) => {
        const item_name = custom_item.customization_item || custom_item.item_code || '';
        const qty = custom_item.qty || 1;
        const rate = custom_item.rate || 0;
        // Always start with switches unchecked regardless of database value
        const default_checked = false; // Force all switches to be unchecked by default
        
        html += `
          <div class="customization-item" 
               data-item-code="${item_name}" 
               data-qty="${qty}" 
               data-rate="${rate}">
            <div class="customization-header">
              <div class="customization-name">${item_name}</div>
              <label class="custom-switch">
                <input type="checkbox" ${default_checked ? 'checked' : ''} id="switch-${index}">
                <span class="switch-slider"></span>
              </label>
            </div>
            <div class="customization-details">
              <div class="customization-qty">
                <span class="fa fa-cubes"></span>
                <span>${__('Qty')}: ${qty}</span>
              </div>
              <div class="customization-rate">
                <span class="fa fa-money"></span>
                <span>${RM.format_currency(rate)}</span>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      html += `
        <div class="no-customization">
          <span class="fa fa-info-circle" style="font-size: 48px; margin-bottom: 10px; display: block;"></span>
          <p>${__('No customization options available')}</p>
        </div>
      `;
    }
    
    html += `
          </div>
        </div>
        <div class="price-summary">
          <span class="price-label">${__('Total Price')}:</span>
          <span class="total-price" id="total-price">${RM.format_currency(item.price_list_rate)}</span>
        </div>
      </div>
    `;
    
    // Set the HTML content
    modal.fields_dict.customization_html.$wrapper.html(html);
    
    // Update price when switches change
    const updateTotalPrice = () => {
      let total = item.price_list_rate;
      modal.$wrapper.find('.customization-item').each(function() {
        const $item = $(this);
        const included = $item.find('.custom-switch input').is(':checked');
        if (included) {
          const rate = parseFloat($item.data('rate'));
          const qty = parseFloat($item.data('qty'));
          total += rate * qty;
        }
      });
      modal.$wrapper.find('#total-price').text(RM.format_currency(total));
    };
    
    // Add event listeners to switches
    modal.$wrapper.on('change', '.custom-switch input', function() {
      const $item = $(this).closest('.customization-item');
      if ($(this).is(':checked')) {
        $item.addClass('selected');
      } else {
        $item.removeClass('selected');
      }
      updateTotalPrice();
    });
    
    // Click on entire card to toggle
    modal.$wrapper.on('click', '.customization-item', function(e) {
      if (!$(e.target).closest('.custom-switch').length) {
        const $switch = $(this).find('.custom-switch input');
        $switch.prop('checked', !$switch.is(':checked')).trigger('change');
      }
    });
    
    // Initial price calculation - will show only base price since all switches are off
    updateTotalPrice();
    
    modal.show();
  }

  reset_items() {
    this.wrapper.find('.pos-items').empty();
    this.init_clusterize();
    this.load_items_data();
  }

  search(opts = {}) {
    Object.assign(this, opts);
    this.filter_items();
  }

  filter_items({ search_term = this.search_term, item_group = this.parent_item_group } = {}) {
    const result_arr = [];
    if (search_term) {
      search_term = search_term.toLowerCase();

      // memoize
      this.search_index = this.search_index || {};
      if (this.search_index[search_term]) {
        this.search_index[search_term].forEach(item => {
          if (`${item.item_code}`.toLowerCase().includes(search_term)) {
            result_arr.push(item)
          } else if (`${item.item_name}`.toLowerCase().includes(search_term)) {
            result_arr.push(item);
          }
        })
        const items = result_arr;
        this.items = items;
        this.render_items(items);
        this.set_item_in_the_cart(items);

        return;
      }
    } else if (item_group === this.parent_item_group) {
      this.items = this.all_items;
      return this.render_items(this.all_items);
    }

    this.get_items({ search_value: search_term, page_length: 9999, item_group }).then(({ items, serial_no, batch_no, barcode }) => {
      items.forEach(item => {
        if (`${item.item_code}`.toLowerCase().includes(search_term)) {
          result_arr.push(item)
        } else if (`${item.item_name}`.toLowerCase().includes(search_term)) {
          result_arr.push(item);
        }
      });

      if (result_arr.length > 0) {
        items = result_arr;
      }

      if (search_term && !barcode) {
        this.search_index[search_term] = items;
      }

      this.items = items;
      this.render_items(items);
      this.set_item_in_the_cart(items, serial_no, batch_no, barcode);
    });
  }

  set_item_in_the_cart(items, serial_no, batch_no, barcode) {
    if (serial_no) {
      this.events.update_cart(items[0].item_code, 'serial_no', serial_no);
      this.reset_search_field();
      return;
    }

    if (batch_no) {
      this.events.update_cart(items[0].item_code, 'batch_no', batch_no);
      this.reset_search_field();
      return;
    }

    if (items.length === 1 && (serial_no || batch_no || barcode)) {
      this.events.update_cart(items[0].item_code, 'qty', '+1');
      this.reset_search_field();
    }
  }

  reset_search_field() {
    this.search_field.set_value('');
    this.search_field.$input.trigger("input");
  }

  get(item_code) {
    return this.items.filter(item => item.item_code === item_code)[0];
  }

  get_all() {
    return this.items;
  }

  get_item_html(item) {
    if (this.order_manage?.item_template) return this.order_manage.item_template(item);

    const price_list_rate = format_currency(item.price_list_rate, this.currency);
    const { item_code, item_name, item_image, description, is_customizable } = item;
    const item_title = item_name || item_code;
    const veg = item.item_type === 'Veg';
    //const template = _template();

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
          item-code="${item_code}" is-customizable=${is_customizable} style="border-radius: 5px; width: 100%;">
            <div class="inner" style="position: inherit; z-index: 100">
                <h4 class="title">
                    <i class="fa fa-circle" style="color: var(--${veg ? 'success' : 'danger'})"></i>
                    ${item_title}
                </h4>
                <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; max-width: 200px;"> ${description}</p>
            </div>
            <div class="icon bg-transparent" style="border-radius: 20px;">
                ${item_image ? `<img src="${item_image}" alt="${item_title}" loading="lazy" decoding="async"></img>` :
      `<span class="no-image placeholder-text" style="font-size: 40px; color:var(--gray);"> ${frappe.get_abbr(item_title)}</span>`}
            </div>
            <div class="small-box-footer" style="padding:3px; background-color: transparent;">
                <div class="form-group" style="position: absolute;">
                    <div class="input-group bg-warning" style="border-radius: 5px; opacity: 0.8; color: black; border-radius:50px;">
                        <div class="input-group-prepend minus-btn" data-target="${item_name}-amount" data-value="-1">
                            <span class="input-group-text fa fa-minus" style="background-color: transparent; border: none; color:orangered;"></span>
                        </div>
                        <div class="custom-file" style="display: block; padding-top:6px; min-width:20px;">
                            <strong class="add-qty" data-ref="${item_name}-amount">1</strong>
                        </div>
                        <div class="input-group-append add-btn" data-target="${item_name}-amount" data-value="1">
                            <span class="input-group-text fa fa-plus" style="background-color: transparent; border: none; color:orangered;"></span>
                        </div>
                        <div class="input-group-append items-in-cart" style="display:none; background-color:green; border-radius:50px;">
                            <span class="input-group-text fa fa-shopping-cart" style="background-color: transparent; border: none; color:white;">
                                <span class="qty-in-cart" style="padding-left:5px;">0</span>
                            </span>
                        </div>
                    </div>
                </div>
                <a class="btn btn-success add-item" data-action="add" style="float:right; border-radius:50px;">
                    <span class="sr-only">${__('Add')}</span>
                    ${__('Add')} ${price_list_rate}
                </a>
            </div>
        </div>`;
    }
  }

  add_item_in_order(item, qty) {
    console.log("=== ADD ITEM IN ORDER ===");
    console.log("Item:", item.item_name);
    console.log("Qty:", qty);
    console.log("Is customizable:", item.is_customizable);
    console.log("this.order_manage exists:", !!this.order_manage);
    console.log("this.item_tree exists:", !!this.item_tree);
    console.log("this.item_tree.order_manage exists:", !!(this.item_tree && this.item_tree.order_manage));
    
    let rate = item.price_list_rate;

    if (item.is_customizable === 1) {
      const parse_sub_items = JSON.parse(item.sub_items);
      console.log("Sub items:", parse_sub_items);
      
      // Start with base price and add selected customizations
      rate = item.price_list_rate + parse_sub_items.filter(sub_item => sub_item.included === 1).reduce((acc, sub_item) => {
        return acc + (sub_item.rate * sub_item.qty);
      }, 0);
      
      console.log("Calculated rate:", rate);
    }

    // Try to get order_manage from multiple sources
    const order_manage = this.order_manage || (this.item_tree && this.item_tree.order_manage);
    console.log("order_manage found:", !!order_manage);
    
    const current_order = order_manage ? order_manage.current_order : null;
    console.log("Current order:", current_order);

    if (!current_order) {
      console.error("NO CURRENT ORDER!");
      frappe.msgprint(__("Please select or create an order first"));
      return;
    }

    if (!RM.check_permissions("order", current_order, "write")) {
      RM.notification("red", __("You cannot modify an order from another User"));
      return;
    }

    const base_item = {
      name: null,
      entry_name: null,
      item_code: item.item_code,
      item_name: item.item_name,
      qty: qty,
      rate: rate,
      price_list_rate: rate,
      discount_percentage: 0,
      discount_amount: 0,
      stock_uom: item.stock_uom,
      item_invoice: null,
      item_invoice_name: null,
      ordered_time: null,
      has_serial_no: 0,
      serial_no: null,
      has_batch_no: 0,
      batch_no: null,
      company: RM.company,
      customer: current_order.data.customer,
      doctype: "Sales Invoice",
      currency: RM.pos_profile.currency,
      pos_profile: RM.pos_profile.name
    };

    console.log("Getting item details...");
    
    this.get_items_detail(base_item).then(item_data => {
      console.log("Got item details:", item_data);
      
      const item_to_push = Object.assign({}, base_item, item_data);
      item_to_push.identifier = RM.uuid("entry");
      item_to_push.status = "Pending";
      item_to_push.notes = null;
      item_to_push.process_status_data = {
        next_action_message: 'Sent',
        color: 'red',
        icon: 'fa fa-cart-arrow-down',
        status_message: 'Add',
      }
      item_to_push.qty = qty;
      item_to_push.sub_items = item.sub_items;
      item_to_push.is_customizable = item.is_customizable;
      item_to_push.rate = rate;
      item_to_push.price_list_rate = rate;

      console.log("Pushing item to order...");
      current_order.push_item(item_to_push);
      console.log("Item pushed!");
    });
  }

  get_items_detail(item) {
    return new Promise(res => {
      if (RM.store.items[item.item_code]) {
        res(RM.store.items[item.item_code]);
      } else {
        frappe.call({
          method: 'erpnext.stock.get_item_details.get_item_details',
          freeze: true,
          args: { args: item }
        }).then(r => {
          RM.store.items[r.message.item_code] = r.message;
          res(r.message);
        });
      }
    });
  }
}