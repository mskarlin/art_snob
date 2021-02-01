import React, { useContext } from 'react';
// import firebase from "firebase/app";
import { defaultAnalytics } from './firebase.js'
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

const orientationFlip = (size) => {

  const size_prefix = size.slice(0,2)
  
  if (size_prefix === 'p_') {
    return 'l_'+size.slice(2)
  }
  else if (size_prefix === 'l_') {
    return 'p_'+size.slice(2)
  }
  else {return null}

}

function RoomSummary({art}){

    const globalState = useContext(store);
    const { state } = globalState;
    const classes = useStyles();


    //TODO: the case when this is the selected room!
    // TODO: memoize this function
    const artMatchExtractor = (art, value) => {
      if ("size_price_list" in art) {
        let typeMatch = art.size_price_list.filter( a => (a.type.trim() === art.size) || (orientationFlip(a.type.trim()) === art.size))
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

    return(
            <Card variant="outlined" className={classes.root}>
                <CardContent>
                    <Typography color="textPrimary" variant="subtitle1" noWrap={true}>
                    {art.name}
                    </Typography>
                    <div className="card-aligner">
                    <div className="art-purchase-col">
                        <ul style={{"listStyleType":"none", "padding": "0px"}} key='ul-top'>
                             <li className="pricing" key='size-pricing'>
                             <Typography variant="body1" key='size-text'>
                              Size: {artMatchExtractor(art, 'size')}
                             </Typography>
                             </li>
                             <li className="pricing" key='price-pricing'>
                             <Typography variant="body1" key='price-text'>
                             Price: {"$"+artMatchExtractor(art, 'price')}
                             </Typography>
                             </li>
                        </ul>
                    </div>
                    <div className="art-purchase-col">
                    <ArtWork size={art.size} showprice={false} PPI={4.0} artImage={art.images} artId={art.artId} nullFrame={false}/>
                    </div>
                    </div>
                </CardContent>
                <CardActions>
                <div className='card-center'>
                <Button style={{"backgroundColor":"#DEE2E6"}} variant="outlined"
                            onClick={() => {
                              defaultAnalytics.logEvent('purchase', 
                              {value: Number(artMatchExtractor(art, 'price'))*0.1,
                              items: [{id: art.artId, 
                              name: art.name, 
                              category: art?.metadata?.cluster_id,
                              variant: artMatchExtractor(art, 'size')
                              }]
                              })
                              openInNewTab(art.page_url+'?curator=mskarlin')
                              }
                              }>Artist page link</Button>
                </div>
                </CardActions>
            </Card>
    )
  }

  // show on the basis of the state for purchase rooms...
  export function PurchaseList({id}) {
    const globalState = useContext(store);
    const { state } = globalState;
    let roomStyle = {}

    if (!(state.rooms.map(x => x.id).includes(id))) {
      navigate('/walls')
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
                  <span className="material-icons md-28" onClick={() => {navigate('/walls')}}>arrow_back_ios</span>
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
        const marginModifier = (ind) => {
          if (ind === 0) {
            return ' top'
          }
          else {
            return ''
          }

        }

        return (purchaseArt.map((art, _) => {
          return (
                 (art.artId)?
                  <div className={"purchase-menu-box"+marginModifier(_)} key={'rmb'+art.id}>
                    <div className="art-purchase" id={art.id} key={art.id}>

                      <RoomSummary art={art} key={'roomartsummary'+art.id}/>
                      
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