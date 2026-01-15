// src/common/bootstrap.js

// 1. A-Frame と共通コンポーネントをここで一括 import
// これにより、このファイルを import した箇所で window.AFRAME が保証されます
import 'aframe';
import 'aframe-environment-component';
// 必要なら他も: import 'aframe-orbit-controls';

// 2. 非モジュールなライブラリ（AR.js, PeerJS）を読み込む関数
function loadScript( src ) {
  return new Promise( ( resolve, reject ) => {
    // すでに読み込まれていたら何もしない（重複防止）
    if ( document.querySelector( `script[src="${src}"]` ) ) {
      resolve();
      return;
    }
    const script = document.createElement( 'script' );
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject( new Error( `Script load error for ${src}` ) );
    document.head.appendChild( script );
  } );
}

// 3. ライブラリ読み込みプロセスを実行し、Promiseとして公開
export const librariesLoaded = ( async () => {
  try {
    console.log( "⚡ System Booting..." );

    // PeerJS のロード
    await loadScript( '/assets/js/libs/peerjs.min.js' );
    console.log( "✅ PeerJS Ready" );

    // AR.js のロード
    // ※ ここで AFRAME は既に import 済みなので、AR.js は window.AFRAME を見つけられます
    await loadScript( '/assets/js/libs/aframe-ar.js' );
    console.log( "✅ AR.js Ready" );

    return true;
  } catch ( err ) {
    console.error( "❌ Boot failed:", err );
    return false;
  }
} )();