// on click channels play
const player = new Plyr('#player');

function playVideo(videoSrc) {
    if (Hls.isSupported()) {
      var hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(player.media);
    } else if (player.media.canPlayType('application/vnd.apple.mpegurl')) {
      player.media.src = videoSrc;
    }
    player.play();
  }

  $(document).ready(function () {
    $('.channel-list-item').click(function () {
      var playerSrc = $(this).data('src');
      playVideo(playerSrc);
    });

    // Check if there's a player source stored in local storage
    var storedSrc = localStorage.getItem('playerSrc');
    if (storedSrc) {
      playVideo(storedSrc);
      localStorage.removeItem('playerSrc');
    }
  });
//==============
function lightmode(){
    document.body.style.backgroundColor="whitesmoke";
    document.body.style.color="black";
    
};
function darkmode(){
    document.body.style.backgroundColor="";
    document.body.style.color="whitesmoke";
    
};
var prc2 = document.querySelector('.practicediv2');
function onclick() {
    prc2.style.backgroundColor = 'green';
}