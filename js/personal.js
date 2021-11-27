$(document).ready(function() {
    $('.widget').mouseenter(function() {
        $('.left-pane-dock-expand svg').css('visibility', 'visible');
    });
    $('.widget').mouseleave(function() {
        $('.left-pane-dock-expand svg').css('visibility', 'hidden');
    });
    $('#mapDiv').mouseenter(function() {
        $('.dock-expand svg').css('visibility', 'visible');
    });
    $('#mapDiv').mouseleave(function() {
        $('.dock-expand svg').css('visibility', 'hidden');
    });

    $('.tool-pane').mouseenter(function() {
        $('.dock-expand svg').css('visibility', 'visible');
    });
    // $('.tool-pane').mouseleave(function() {
    //     $('.dock-expand svg').css('visibility', 'hidden');
    // });
});