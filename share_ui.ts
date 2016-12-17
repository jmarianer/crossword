/// <reference types="jqueryui" />

import * as $ from 'jquery';
(<any> window).jQuery = $;

// tslint:disable:ordered-imports
// I'm not sure what the correct order is, but it's not alphabetical. There s a
// convoluted dependency tree; jQuery-UI isn't meant to be used with Browserify
// (even though it claims to be), or else I'm missing something stupid.
import 'jquery-ui/ui/version';
import 'jquery-ui/ui/widget';
import 'jquery-ui/ui/data';
import 'jquery-ui/ui/tabbable';
import 'jquery-ui/ui/plugin';
import 'jquery-ui/ui/scroll-parent';
import 'jquery-ui/ui/position';
import 'jquery-ui/ui/keycode';
import 'jquery-ui/ui/focusable';
import 'jquery-ui/ui/safe-blur';
import 'jquery-ui/ui/unique-id';
import 'jquery-ui/ui/safe-active-element';
import 'jquery-ui/ui/widgets/mouse';
import 'jquery-ui/ui/widgets/button';
import 'jquery-ui/ui/widgets/dialog';
import 'jquery-ui/ui/widgets/draggable';

function dialog(id: string) {
  let url = document.location.origin + '/puzzle/' + id;
  $('#share-url').text(url);
  $('#dialog').dialog({
    buttons: {
      OK: () => {
        $('#dialog').dialog('close');
      },
    },
    modal: true,
  });
  $('button').blur();
}

$(() => {
  let id = $('.crossword').data('id');
  $('#collaborate-button').click(() => {
    dialog(id);
  });
  $('#fork-button').click(() => {
    $.get('/fork/' + id, {}, dialog);
  });
  $('#clone-button').click(() => {
    $.get('/clone/' + id, {}, dialog);
  });
});
