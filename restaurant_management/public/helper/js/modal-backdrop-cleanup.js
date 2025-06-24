// Global modal backdrop cleanup utility
(function() {
  'use strict';
  
  // Keep track of open modals
  let openModalCount = 0;
  
  // Function to clean orphaned backdrops
  function cleanOrphanedBackdrops() {
    const modals = $('.modal:visible');
    const backdrops = $('.modal-backdrop');
    
    // If there are more backdrops than visible modals, remove extras
    if (backdrops.length > modals.length) {
      console.log('Cleaning orphaned backdrops:', backdrops.length - modals.length);
      
      // Remove extra backdrops
      backdrops.slice(modals.length).remove();
      
      // Fix body state if no modals are open
      if (modals.length === 0) {
        $('body').removeClass('modal-open').css({'overflow': '', 'padding-right': ''});
      }
    }
  }
  
  // Override frappe.msgprint to add cleanup
  const originalMsgprint = frappe.msgprint;
  frappe.msgprint = function(msg, title, is_minimizable, wide, callback) {
    const result = originalMsgprint.apply(this, arguments);
    
    // Add cleanup handler when msgprint dialog is closed
    setTimeout(() => {
      const msgprintDialog = $('.msgprint-dialog:last');
      if (msgprintDialog.length) {
        msgprintDialog.on('hidden.bs.modal', function() {
          setTimeout(cleanOrphanedBackdrops, 100);
        });
      }
    }, 100);
    
    return result;
  };
  
  // Override frappe.throw to add cleanup
  const originalThrow = frappe.throw;
  frappe.throw = function(msg, exc, title, wide, callback) {
    const result = originalThrow.apply(this, arguments);
    
    // Add cleanup handler
    setTimeout(() => {
      const errorDialog = $('.msgprint-dialog:last');
      if (errorDialog.length) {
        errorDialog.on('hidden.bs.modal', function() {
          setTimeout(cleanOrphanedBackdrops, 100);
        });
      }
    }, 100);
    
    return result;
  };
  
  // Monitor Bootstrap modal events
  $(document).on('show.bs.modal', '.modal', function() {
    openModalCount++;
  });
  
  $(document).on('hidden.bs.modal', '.modal', function() {
    openModalCount--;
    
    // Clean up after modal closes
    setTimeout(() => {
      cleanOrphanedBackdrops();
      
      // Double-check if all modals are closed
      if (openModalCount <= 0) {
        openModalCount = 0;
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open').css({'overflow': '', 'padding-right': ''});
      }
    }, 300);
  });
  
  // Periodic cleanup as failsafe
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      cleanOrphanedBackdrops();
    }
  }, 5000);
  
  // Export for manual use if needed
  window.cleanOrphanedBackdrops = cleanOrphanedBackdrops;
})();