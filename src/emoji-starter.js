import "aframe";

AFRAME.registerComponent( "emoji-starter", {
  init() {
    this.emojiA = document.querySelector( "#emojiA" );
    this.emojiAstage = document.querySelector( "#emojiAstage" );
    this.emojiB = document.querySelector( "#emojiB" );
    this.emojiBstage = document.querySelector( "#emojiBstage" );
    this.emojiC = document.querySelector( "#emojiC" );
    this.emojiCstage = document.querySelector( "#emojiCstage" );
    this.emojiD = document.querySelector( "#emojiD" );
    this.emojiDstage = document.querySelector( "#emojiDstage" );
    this.emojiE = document.querySelector( "#emojiE" );
    this.emojiEstage = document.querySelector( "#emojiEstage" );

    document.addEventListener( "emojistart", ( e ) => {
      this.emojiA.emit( "emojistart", null, false );
      this.emojiAstage.emit( "emojistart", null, false );
      this.emojiB.emit( "emojistart", null, false );
      this.emojiBstage.emit( "emojistart", null, false );
      this.emojiC.emit( "emojistart", null, false );
      this.emojiCstage.emit( "emojistart", null, false );
      this.emojiD.emit( "emojistart", null, false );
      this.emojiDstage.emit( "emojistart", null, false );
      this.emojiE.emit( "emojistart", null, false );
      this.emojiEstage.emit( "emojistart", null, false );
      console.log( "start" );
    } );
  },
  tick() {
  }
} );