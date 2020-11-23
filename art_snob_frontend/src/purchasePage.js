import React, { useState, useReducer, useEffect, useRef, useContext } from 'react';
import { store } from './store.js';
import {openInNewTab} from './detailView.js';
import {ArtWork} from './artComponents.js'


function RoomSummary({art}){

    const globalState = useContext(store);
    const { state, dispatch } = globalState;

    //TODO: the case when this is the selected room!
    // TODO: memoize this function
    const artMatchExtractor = (art, value) => {
      if ("size_price_list" in art) {
        let typeMatch = art.size_price_list.filter( a => a.type.trim() == art.size)
        if (typeMatch.length > 0) {
          return "$"+typeMatch[0][value]
        }
        else {
          return "$0"
        }
      }
      else {
        return "$0"
      }

    }

    const openAllWindows = () => {
        console.log('buyart', state.purchaseList[0].art)
        state.purchaseList[0].art.forEach( a => {
            openInNewTab(a.page_url+'?curator=mskarlin');
        })
    }

    return(
            <div className="art-purchase-top-col">
                <div className="purchase-title">{art.name}</div>
                <div className="art-purchase-container">
                    <div className="art-purchase-col">
                    <ArtWork size={art.size} showprice={false} PPI={1.5} artImage={art.images} artId={art.artId} nullFrame={false}/>

                    </div>
                    <div className="art-purchase-col">
                        <ul style={{"listStyleType":"none", "padding": "0px"}}>
                             <li className="pricing">Size: {artMatchExtractor(art, 'size')}</li>
                             <li className="pricing">Price: {artMatchExtractor(art, 'price')}</li>
                             <button className="detail-button purchase" style={{"backgroundColor":"#DEE2E6"}}
                            onClick={() => {openInNewTab(art.page_url+'?curator=mskarlin')}}>Artist page link</button>
                        </ul>
                    </div>
                </div>
            </div>
    )
  }

  // show on the basis of the state for purchase rooms...
  export function PurchaseList() {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
    let roomStyle = {}

    if (state.newRoomShow.show)
      {roomStyle = {...roomStyle, marginTop: '78px'}}

    // optionally give instructions for placing a work of art into a room
    const purchaseExplain = () => {
        return (
            <>
              <div className="explain-menu" style={{top: '78px'}}>
                  <span className="material-icons md-36" onClick={() => {dispatch({type: 'PURCHASE_LIST', purchaseList: null})}}>keyboard_backspace</span>
                  <div className="explain-text">Purchase your art at the source...</div>
              </div>
              <div className="explain-menu" style={{top: '119px'}}>
                <div className="explain-text" style={{'fontSize': "13px"}}>(Note we are compensated as affiliates for these links)</div>
            </div>
            </>
        )
    }

    // TODO: need to not show this when the browse menu is up
    const purchaseFeed = () => {
    
        return (state.purchaseList[0].art.map((art, _) => {
          return (
                 (art.artId)?
                  <div className="purchase-menu-box" key={'rmb'+art.id}>
                    <div className="art-purchase" id={art.id} key={art.id}>

                      <RoomSummary art={art}/>
                      
                    </div>
                  </div>:<></>
                  )
          })
          )

    }


    return(
    (state.purchaseList) && (
    <div className="room-main">
        <div className="room-feed purchase" style={roomStyle}>
        {purchaseExplain()}
        {
          purchaseFeed()
        }
        </div>
       </div>
    ))
  }