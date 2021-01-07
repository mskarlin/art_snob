import React, {useContext} from 'react';
import { store } from './store.js';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import {ArtWork} from './artComponents.js'
import Typography from '@material-ui/core/Typography';
import WallpaperIcon from '@material-ui/icons/Wallpaper';
import UndoIcon from '@material-ui/icons/Undo';

function HistoryCard({history, dispatch}) {

    const translate = {'clusterDislike': 'Disliked taste: ', 
                        'clusterLike': 'Liked taste: ', 
                        'reco_approve': 'Approved recommendation: ', 
                        'reco_disapprove': 'Disapproved recommendation: ', 
                        'likeArt': 'Favorited: ', 
                        'viewArt': 'Viewed: ',
                        'addArt': 'Added to room: '}
    
    if (history.with.id === null) {
        return <></>
    }

    return (
    <Card variant="outlined">
        <CardContent>
            <div className="card-aligner">
                <div className="art-purchase-row">
                    {(history?.with?.image !== null)?
                    <div style={{cursor: 'pointer'}}>
                        <ArtWork size={'medium'} showprice={false} PPI={0.5} artImage={history?.with?.image} artId={history.with.id} nullFrame={false}/>
                    </div>
                    :
                    <WallpaperIcon style={{paddingLeft: '10px'}}/>
                    }                
                    <Typography style={{paddingLeft: '10px'}} noWrap={true} variant='caption'><b>{translate[history.what]}</b> {history.with.name}</Typography>
                    
                    <UndoIcon onClick = {() => dispatch({type: 'REMOVE_HISTORY', id: history.id})} style={{paddingLeft: '10px', cursor:'pointer'}}/>

                </div>
            </div>
        </CardContent>
    </Card>)
}


export function History() {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
    
return (        <div style={{'marginTop': '87px', 'paddingLeft': '25px', 'paddingRight': '25px', maxWidth: '1000px', 'marginLeft': 'auto', 'marginRight': 'auto'}}>
                    <h1 style={{ fontFamily: 'Noto Sans JP'}}>History</h1>
                    <p style={{ fontFamily: 'Noto Sans JP'}}>Find or undo the actions that power your recommendations.</p>
                    {state.history.map( (h, index) => <HistoryCard history={h} dispatch={dispatch} key={'history-card'+index}/>)
                    }
                </div>
)

}
