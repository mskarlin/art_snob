import React, { useState, useReducer, useEffect, useContext } from 'react';
import { useTagFetch } from './feedHooks'
import {useArtData} from './artComponents'
import { store } from './store.js';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import _ from 'lodash';
import { navigate, useLocation } from "@reach/router"
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ThumbUpAltOutlinedIcon from '@material-ui/icons/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@material-ui/icons/ThumbDownAltOutlined';

export const openInNewTab = (url) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
    if (newWindow) newWindow.opener = null
}

export function SingleCarousel({endpoint, index, showFavoriteSelect, initialImages={images:[], cursor: null, fetching: true}, imgSize=''}) {
    const globalState = useContext(store);
    const { state } = globalState;

    const feedReducer = (state, action) => {
    switch (action.type) {
        case 'STACK_IMAGES':
            return {...state, images: state.images.concat(action.images), cursor: action.cursor}
        case 'FETCHING_IMAGES':
            return {...state, fetching: action.fetching}
        case 'RESET':
            return action.new_feed
        default:
            return state;
    }
    }
    const [feedData, feedDataDispatch] = useReducer(feedReducer, initialImages)
    const [loadMore, setLoadMore] = useState(true);

    // initialize array
    // var refArray = [];
    
    // // append new value to the array
    // for (var i = 0; i < feedData.images.length; i++) {
    //     refArray.push(React.createRef())
    // }

    // const refs = useRef(refArray);

    // this changes every single render (since the cursor changes...) huge bug that took days to fix...
    const endpointBuilder  = (endpoint) => {
        if (endpoint.search('\\?') !== -1) {
            return feedData.cursor ? endpoint+'&start_cursor='+feedData.cursor : endpoint
        }
        else {
            return feedData.cursor ? endpoint+'?start_cursor='+feedData.cursor : endpoint
        }
    }
    
    const formatEndpoint = endpointBuilder(endpoint)
    const renderLikes = showFavoriteSelect ? state.likedArt : null

    useTagFetch(loadMore, feedDataDispatch, setLoadMore, endpoint, formatEndpoint, renderLikes)

    return (<div key={'feed-'+index.toString()} className={'carousal-spacing main-feed '+imgSize}>
                {feedData.images.map((image, index) => {
                    const { name, images, id } = image
                    return (
                    <div key={'art-'+index.toString()+index.toString() } className={'imgholder ' + imgSize} 
                    // ref={refs.current[index]}
                    >
                            <img
                            alt={name}
                            data-src={'https://storage.googleapis.com/artsnob-image-scrape/'+images}
                            className="imgholder img"
                            src={'https://storage.googleapis.com/artsnob-image-scrape/'+images}
                            style={{"pointerEvents": "all"}}
                            onClick={()=>{
                                navigate('/detail/'+id)
                                }}
                            />
                    </div>
                    )
                })}
                {showFavoriteSelect && (<div className={'imgholder ' + imgSize}> 
                                            <span className="material-icons md-36" style={{'color': 'black'}}>save_alt</span> 
                                            <div className='browse-imgtext'>Save art to find it here</div>
                                        </div>)}
                    <div className={'imgholder ' + imgSize} style={{'pointerEvents': 'all'}} onClick={()=>setLoadMore(true)}> 
                        <span className="material-icons md-36" style={{'color': 'black'}}>add_circle_outline</span> 
                        <div className='browse-imgtext'>Show me more.</div>
                    </div>
                </div>
    )

}

export function ArtCarousel({endpoints, imgSize='', showTitle=true}) {

    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    // lists of carousels for each type of art
    const makeTitle = (endpoint) => {
        if (endpoint.substring(1, 14) === "similar_works") {
            return "Similar works for you"
        }
        else if (endpoint.substring(1,5) === "tags") {
            let tagName = endpoint.substring(6)
            return tagName.charAt(0).toUpperCase() + tagName.slice(1) + " works"
        }
        else if (endpoint.substring(1,6) === "likes") {
            return "My saved art"
        }
        else if (endpoint.substring(1,5) === "feed") {
            return "Recommended Art"
        }
    }

    return (
            <div className='art-feed detail'>
            {endpoints.map((endpoint, eindex) => {
            return (
            <div key={'endpoint'+eindex}>
                {(showTitle)?
                <div className='detail-title-tag'>
                    <div className='detail-name'>
                    {makeTitle(endpoint)}
                    </div>
                    {((endpoint.substring(1,5) === "tags") && (state.rooms.length > 0))?
                    <span className="material-icons md-28" style={{"paddingLeft": "5px"}} 
                    onClick={() => {let tagName = endpoint.substring(6);
                                    tagName = tagName.charAt(0).toUpperCase() + tagName.slice(1) 
                                    dispatch({type: 'CHANGE_SEARCH_TAG_SET', searchTagSet: '/tags/'+tagName, searchTagNames: [tagName]});
                                    dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: state.rooms[0]})
                                    navigate('/browse/'+state.rooms[0].id)}}>search</span>:
                    <></>}
                </div>: <></>}
                <div className={'art-feed-small ' + imgSize}>
                    <SingleCarousel imgSize={imgSize} endpoint={endpoint} showFavoriteSelect={endpoint.substring(1,6) === "likes"} index={eindex} key={'sc-'+endpoint}/>
                </div>
            </div>
            )
            }
            )}
        </div>
            )
}

function ImgColumn ({art}) {
    
    return (
      <div className='vert-column'>
        {art.map((image, index) => {
                const { name, images, id } = image
                return (
                <div key={'art-'+index.toString()+index.toString() } className={'imgholder large'}>
                        {(id===null)?<CircularProgress style={{'position': 'absolute',
                        'color': '#018E42', zIndex: 2}}/>:
                        <img
                        alt={name}
                        data-src={"https://storage.googleapis.com/artsnob-image-scrape/"+images}
                        className={"imgholder img "}
                        src={"https://storage.googleapis.com/artsnob-image-scrape/"+images}
                        style={{"pointerEvents": "all"}}
                        onClick={() => {
                            navigate('/detail/'+id)
                            }}
                        />}
                </div>
                )
            })}
      </div>
    )
  }

const useArtColumnFetch = (loadMore, dispatch, endpoint, formatEndpoint, show) => {
    useEffect(() => {
        if (formatEndpoint && loadMore) {
            fetch(process.env.REACT_APP_PROD_API_DOMAIN+formatEndpoint)
            .then(data => data.json())
            .then(json => {
                if (show) {
                    dispatch({ type: 'ADD_FEED_IMAGES', images: json.art, cursor: json.cursor})
                    dispatch({type: 'RELOAD_FEED', reload: false})
                }
            })
            .catch(e => {
                // handle error
                return e
            })
    }
    }, [dispatch, endpoint, loadMore, show])
}

export function ArtColumns({title, endpoint, navigate, numColumns=2, show=true}) {
    // TODO: figure out implementation for likes and explore here... then work out the
    // TODO: detail url implementation, you should be able to share URLs of art wherever you find it
    // TODO: if you find it in your browse feed, then the link should probably go to a room feed
    // TODO: and then it'll have to build the default room if it doesn't exist-- then when you 
    // TODO: try to get to the browse feed, it'll simply run you back to the taste flow.
    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    // this changes every single render (since the cursor changes...) huge bug that took days to fix...
    const endpointBuilder  = (endpoint) => {
        if (endpoint.search('\\?') !== -1) {
            return state.artBrowseSeed.feedCursor ? endpoint+'&start_cursor='+state.artBrowseSeed.feedCursor: endpoint
        }
        else if (endpoint === '') {
            return null
        }
        else {
            return state.artBrowseSeed.feedCursor ? endpoint+'?start_cursor='+state.artBrowseSeed.feedCursor : endpoint
        }
    }
    
    const formatEndpoint = endpointBuilder(endpoint)

    useArtColumnFetch(state.artBrowseSeed.reload, dispatch, endpoint, formatEndpoint, show)

    const showControl = () => {
        if (show) {
            return (<>
                {/* <div className='select-explain'>
                    <Typography variant="h5" align="center">
                    {title}
                    </Typography>
                </div> */}
    
                <div className='preference-flex'>
                    {_.range(numColumns).map((i) => {
                        return <ImgColumn key={'pArtCol-'+i.toString()} navigate={navigate} art={state.artBrowseSeed.feed.slice(i*state.artBrowseSeed.feed.length/numColumns, 
                        (i+1)*state.artBrowseSeed.feed.length/numColumns)}/>
                    })}
                </div>
                
                <div className={'imgholder large'} style={{'pointerEvents': 'all', 'width': '100%', 'height': '100px'}} onClick={()=>dispatch({type: 'RELOAD_FEED', reload: true})}> 
                        <span className="material-icons md-36" style={{'color': 'black'}}>add_circle_outline</span> 
                        <div className='browse-imgtext'>Show me more.</div>
                </div>

                </>)
        }
        else {
            return <></>
        }
    }

    return (
    showControl()
  )
}

export function LikesColumns({art, numColumns=2, showFavoriteSelect, show}) {
    const showCondition = () => {
        if (show) {
            return (
            <>  
                {/* <div className='select-explain'>
                    <Typography variant="h5" align="center">
                    {'Saved Art'}
                    </Typography>
                </div> */}

                <div className={'imgholder large'}> 
                    <span className="material-icons md-36" style={{'color': 'black'}}>save_alt</span> 
                    <div className='browse-imgtext'>Save art to find it here</div>
                </div>
                <div className='preference-flex'>
                    {_.range(numColumns).map((i) => {
                        return <ImgColumn key={'pArtCol-'+i.toString()} navigate={navigate} art={art.slice(i*art.length/numColumns, 
                        (i+1)*art.length/numColumns)}/>
                    })}
                </div>
                </>
            )
        }
        else {
            return (<></>)
        }


    }

    return (
        showCondition()
)
}

function RecommendedReason({metadata, state}) {
    // cover the case that you're interested
    const allLikes = _.flatten(state.rooms.map(r => r.clusterData.likes))
    const allDislikes = _.flatten(state.rooms.map(r => r.clusterData.dislikes))
    if (allLikes.includes(metadata.cluster_id)) {
        return (<Typography variant="body1" align="center" 
          style={{paddingLeft: "10px", paddingRight: "10px"}}>
        {'You may like because of your enjoyment of '}
        <b> {metadata.cluster_desc.toLowerCase()}</b>
        {' art.'}
      </Typography>)
    }
    else if (allDislikes.includes(metadata.cluster_id)) {
        return (<Typography variant="body1" align="center"
        style={{paddingLeft: "10px", paddingRight: "10px"}}>
        {'You may dislike because of your aversion to '}
        <b> {metadata.cluster_desc.toLowerCase()}</b>
        {' art.'}
      </Typography>) 
    }
    else {
        return (<Typography variant="body1" align="center"
        style={{paddingLeft: "10px", paddingRight: "10px"}}>
        {'How do you like '}
        <b> {metadata.cluster_desc.toLowerCase()}</b>
        {' art?'}
      </Typography>) 
    }
}


export function ArtDetail({nTags, id}) {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
     
    const handleScrollClick = () => {
        window.scrollTo(0, 0)
    }
    
    const [artData, setArtData] = useState({name: "", 
                                            size_price_list: [], 
                                            standard_tags: [], 
                                            artist: "",
                                            images: "",
                                            metadata: {"cluster_id": -1, "cluster_desc": ""}    
                                            });

    useArtData(id, setArtData, handleScrollClick)

    let artTags = ['/similar_works/'+id]
    const endpoints = artTags.concat(artData.standard_tags.map(i => '/tags/'+i.toLowerCase()))

    // TODO: figure out why this doesnt update...
    const saveCopy = () => {
        if (state.likedArt.map((x) => x.artId).includes(artData.artId)) {
            return "Favorited!"
            }
        else {
            return "Add favorite"
        }
}

    const buttonColor = (buttonName) => {
        if (state.recommendationApprovals.approvals.includes(artData.artId) && buttonName === "approve") {
            return "secondary"
        }
        else if (state.recommendationApprovals.disapprovals.includes(artData.artId) && buttonName === "disapprove") {
            return "secondary"
        }
        else {
            return "default"
        }
    }

return (
    <div className="fullpage-detail-container">
    <div className="detail-container">
        <div className="detail-title">
            <div className="detail-name">
            {artData.name.replace("Framed Art Print", "")}
            </div>
            <span className="material-icons md-28" onClick={() => {
            window.history.back();}
            }>arrow_back_ios</span>
        </div>
        <div className="large-image">
        <img
            alt={artData.artist}
            data-src={'https://storage.googleapis.com/artsnob-image-scrape/'+artData.images}
            className="large-image img"
            src={'https://storage.googleapis.com/artsnob-image-scrape/'+artData.images}
            />
        </div>
        {/* <div className="tag-holder">
        {artData.standard_tags.slice(0, ntags).map(i => {
            return <button className="tag-button" key={i} onClick={() => { 
        dispatch({type: 'CHANGE_SEARCH_TAG_SET', searchTagSet: '/tags/'+i, searchTagNames: [i]});
        dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: state.rooms[0]})
        navigate('/browse/'+state.rooms[0].id)}
        }>{i}</button>})}
        </div> */}
        <div className="tag-holder">
            {RecommendedReason({metadata: artData.metadata, state: state})}
            <ButtonGroup aria-label="outlined primary button group" style={{paddingTop: "15px"}}>
            <Button color={buttonColor('approve')} onClick={() => {
              dispatch({type: 'RECOMMENDATION_APPROVAL', art: artData, approval: true});
            }}>{<ThumbUpAltOutlinedIcon/>}</Button>
            <Button color={buttonColor('disapprove')} onClick={() => {
              dispatch({type: 'RECOMMENDATION_APPROVAL', art: artData, approval: false});
            }}>{<ThumbDownAltOutlinedIcon/>}</Button>
        </ButtonGroup>
        </div>
        <div className="price-size-action-container">
            <div className="price-size">
            <ul style={{"listStyleType":"none", "padding": "0px"}}>
            <li className="pricing">Sizes:</li>
            {artData.size_price_list.map(x => {
                return <li className="pricing" key={'size_'+x.size}>{x.size}</li>
            })}
            </ul>
            </div>
            <div className="price-size" style={{'width': "15%"}}>
            <ul style={{"listStyleType":"none", "padding": "0px"}}>
            <li className="pricing">Prices:</li>
            {artData.size_price_list.map(x => {
                return <li className="pricing" key={'price_'+x.price}>{x.price}</li>
            })}
            </ul>
            </div>
            <div className="detail-purchase-buttons">
            <Button variant="contained" color="secondary" 
            style={{width: "150px"}}
            onClick={()=>{dispatch({'type': 'POTENTIAL_ART', 'artData': artData});
                                                            dispatch({'type': 'ART_BROWSE_SEED', 'artBrowseSeed': null})
                                                            dispatch({'type': 'CLOSE_ALL_MENUS'})
                                                            navigate('/rooms')}}>
            Add to room
            </Button>            
            <Button variant="contained" style={{width: "150px", marginTop: "15px"}}
            onClick={()=>{dispatch({'type': 'LIKE_ART', 'art': artData})}}>{saveCopy()}</Button>
            <Button variant="contained" style={{width: "150px", marginTop: "15px"}}
            onClick={() => {openInNewTab(artData.page_url+'?curator=mskarlin')}}>Purchase work</Button>
            <Typography variant='caption' align='center'>(Affiliate link)</Typography>
            </div>
        </div>
        <ArtCarousel endpoints={endpoints}/>
    </div>
    </div>
)

}
