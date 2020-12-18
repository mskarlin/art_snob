import React, { useState, useReducer, useEffect, useRef, useContext } from 'react';
import { store } from './store.js';
import {openInNewTab} from './detailView.js';
import {ArtWork} from './artComponents.js'
import { navigate } from "@reach/router"
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';


const useStyles = makeStyles({
  root: {
    width: 300
  }
});


function RoomSummary({art}){

    const globalState = useContext(store);
    const { state, dispatch } = globalState;
    const classes = useStyles();


    //TODO: the case when this is the selected room!
    // TODO: memoize this function
    const artMatchExtractor = (art, value) => {
      if ("size_price_list" in art) {
        let typeMatch = art.size_price_list.filter( a => a.type.trim() == art.size)
        if (typeMatch.length > 0) {
          return typeMatch[0][value]
        }
        else {
          return "0"
        }
      }
      else {
        return "0"
      }

    }

    const openAllWindows = () => {
        state.purchaseList[0].art.forEach( a => {
            openInNewTab(a.page_url+'?curator=mskarlin');
        })
    }

    return(
            <Card variant="outlined" className={classes.root}>
                <CardContent>
                    <Typography color="textPrimary" variant="subtitle1" noWrap={true}>
                    {art.name}
                    </Typography>
                    <div className="art-purchase-col">
                    <ArtWork size={art.size} showprice={false} PPI={4.0} artImage={art.images} artId={art.artId} nullFrame={false}/>

                    </div>
                    <div className="art-purchase-col">
                        <ul style={{"listStyleType":"none", "padding": "0px"}}>
                             <li className="pricing">
                             <Typography variant="body">
                              Size: {artMatchExtractor(art, 'size')}
                             </Typography>
                             </li>
                             <li className="pricing">
                             <Typography variant="body">
                             Price: {"$"+artMatchExtractor(art, 'price')}
                             </Typography>
                             </li>
                        </ul>
                    </div>
                </CardContent>
                <CardActions>
                <Button style={{"backgroundColor":"#DEE2E6"}} variant="outlined"
                            onClick={() => {openInNewTab(art.page_url+'?curator=mskarlin')}}>Artist page link</Button>
                </CardActions>
            </Card>
    )
  }

  // show on the basis of the state for purchase rooms...
  export function PurchaseList({id}) {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
    let roomStyle = {}

    if (!(state.rooms.map(x => x.id).includes(id))) {
      navigate('/rooms')
    }

    const extractPurchaseArt = () => {

      let maybeArt = state.rooms.filter(room => room.id === id)

      if (maybeArt.length > 0 ) {
        return maybeArt[0].art
        }
      else {
        return []
      }

    }

    const purchaseArt = extractPurchaseArt()

    // optionally give instructions for placing a work of art into a room
    const purchaseExplain = () => {
        return (
            <>
              <div className="explain-menu" style={{top: '78px'}}>
                  <span className="material-icons md-36" onClick={() => {navigate('/rooms')}}>keyboard_backspace</span>
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
    
        return (purchaseArt.map((art, _) => {
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
    <div className="room-main">
        <div className="room-feed purchase" style={roomStyle}>
        {purchaseExplain()}
        {
          purchaseFeed()
        }
        </div>
       </div>
    )
  }