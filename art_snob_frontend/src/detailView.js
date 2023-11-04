import React, { useState, useReducer, useEffect, useContext } from 'react';
import { useTagFetch } from './feedHooks'
import {useArtData} from './artComponents'
// import firebase from "firebase/app";
import { defaultAnalytics } from './firebase.js'
import { store } from './store.js';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import _ from 'lodash';
import { navigate, useLocation } from "@reach/router"
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Popper from '@material-ui/core/Popper';
import ThumbUpAltOutlinedIcon from '@material-ui/icons/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@material-ui/icons/ThumbDownAltOutlined';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

export const openInNewTab = (url) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
    if (newWindow) newWindow.opener = null
}

export function SingleCarousel({endpoint, index, showFavoriteSelect, initialImages={images:[
    {name: '', images: '', id: null},
    {name: '', images: '', id: null},
    {name: '', images: '', id: null},
    {name: '', images: '', id: null},
    {name: '', images: '', id: null},
    {name: '', images: '', id: null},
    {name: '', images: '', id: null},
    {name: '', images: '', id: null},
    {name: '', images: '', id: null},
    {name: '', images: '', id: null}
], cursor: null, fetching: true}, imgSize=''}) {
    const globalState = useContext(store);
    const { state } = globalState;

    const feedReducer = (state, action) => {
    switch (action.type) {
        case 'STACK_IMAGES':
            let filledSlice = state.images.filter(x=>x.id !== null)
            let unfilledSlice = state.images.filter(x=>x.id === null)
            if (unfilledSlice.length > 0) {
                return {...state, images: filledSlice.concat(action.images).concat(unfilledSlice.slice(action.images.length)), cursor: action.cursor}
            }
            else {
                return {...state, images: state.images.concat(action.images), cursor: action.cursor}
            }
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

    const resizedImageEndpoint = (imgSize) => {
        switch(imgSize) {
            case 'small':
                return 'https://storage.googleapis.com/deco-images/thumb@250_'
            case 'large':
                return 'https://storage.googleapis.com/deco-images/thumb@500_'
            default:
                return 'https://storage.googleapis.com/deco-images/thumb@500_'
        }
    }


    return (<div key={'feed-'+index.toString()} className={'carousal-spacing main-feed '+imgSize}>
                {feedData.images.map((image, index) => {
                    const { name, images, id } = image

                    const imgLoc = (typeof images === 'string' || images instanceof String)?images.split('/').slice(-1)[0]:''
                    
                    return (
                    <div key={'art-'+index.toString()+index.toString() } className={'imgholder ' + imgSize}>
                        {(id===null)?<CircularProgress style={{'position': 'absolute',
                        'color': '#018E42', zIndex: 2}}/>:
                            <img
                            alt={name}
                            data-src={resizedImageEndpoint(imgSize)+imgLoc}
                            className="imgholder img"
                            src={resizedImageEndpoint(imgSize)+imgLoc}
                            style={{"pointerEvents": "all"}}
                            onClick={()=>{
                                navigate('/detail/'+id)
                                }}
                            />}
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
                        data-src={"https://storage.googleapis.com/deco-images/thumb@500_"+images?.split('/').slice(-1)[0]}
                        className={"imgholder img "}
                        src={"https://storage.googleapis.com/deco-images/thumb@500_"+images?.split('/').slice(-1)[0]}
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

export function ArtColumns({title, endpoint, navigate, numColumns=2, show=true, chunkLength=26}) {

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
                <div className='preference-flex'>
                    {_.range(numColumns).map((i) => {
                        return <ImgColumn key={'pArtCol-'+i.toString()} navigate={navigate} art={state.artBrowseSeed.feed.filter((x,index)=>index % numColumns === i)}/>
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
        {'How do you like your recommendation for '}
        <b> {metadata.cluster_desc.toLowerCase()}</b>
        {' art?'}
      </Typography>)
    }
    else if (allDislikes.includes(metadata.cluster_id)) {
        return (<Typography variant="body1" align="center"
        style={{paddingLeft: "10px", paddingRight: "10px"}}>
        {'You may dislike this work because of your aversion to '}
        <b> {metadata.cluster_desc.toLowerCase()}</b>
        {' art.'}
      </Typography>) 
    }
    else {
        return (<Typography variant="body1" align="center"
        style={{paddingLeft: "10px", paddingRight: "10px"}}>
        {'Do you like this '}
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

    const [ nativeImageSize, setNativeImageSize] = useState({width: 1, height: 1})

    const replaceWithLandscape = (nativeImageSize.width / nativeImageSize.height > 1.1) ? true : false;


    const onImgLoad = ({target:img}) => {
      setNativeImageSize({height:img.offsetHeight, width:img.offsetWidth});
    }

    const colorList = [{name: 'black', code: '#222'}, 
                        {name: 'white', code: '#FDFEFE'}, 
                        {'name': 'natural wood', code: '#E6BF83'},
                        {'name': 'walnut wood', code: '#502900'},
                        {'name': 'pecan wood', code: '#5A330A'},
                        {'name': 'red', code: '#7C0A02'},
                    ]
    
    const [artData, setArtData] = useState({name: "", 
                                            size_price_list: [], 
                                            standard_tags: [], 
                                            artist: "",
                                            images: "",
                                            metadata: {"cluster_id": -1, "cluster_desc": ""}    
                                            });
    
    const currentSize = state.rooms.map(r => r.art.filter(x=>x.artId === artData.artId)[0]?.size).filter(x => x ? true : false)[0]
    const currentColor = state.rooms.map(r => r.art.filter(x=>x.artId === artData.artId)[0]?.frameColor).filter(x => x ? true : false)[0]

    const [selectedSize, setSelectedSize] = useState(currentSize ? currentSize : 'medium')
    const [selectedColor, setSelectedColor] = useState(currentColor ? currentColor : 'black')


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

    const inRoom = () => {
        if (state.rooms.map(r => r.art.map(x=>x.artId).includes(id)).includes(true)){
            return true
        }
        else {
            return false
        }
    }

    defaultAnalytics.logEvent('view_item', {'items': [{id: artData.artId, name: artData.name, 
        category: artData?.metadata?.cluster_id
        }]})
    
    dispatch({...artData, type: 'VIEW_ART'})

    const handleUpdateArtSize = (event) =>
    {
        setSelectedSize(event.target.value);

        if (inRoom()) {
            let selectedRoomId = (state?.artBrowseSeed?.id) ? state?.artBrowseSeed?.id : state?.rooms[0]?.id
            let newSize = (replaceWithLandscape && event.target.value.slice(0,2) === 'p_') ? 'l_'+event.target.value.slice(2) : event.target.value
            dispatch({type: 'CHANGE_ART_SIZE', size: newSize, id: artData.artId, roomId: selectedRoomId})
            navigate('/walls')
        }
    }

    const handleUpdateFrameColor = (event) =>
    {
        setSelectedColor(event.target.value);

        if (inRoom()) {
            let selectedRoomId = (state?.artBrowseSeed?.id) ? state?.artBrowseSeed?.id : state?.rooms[0]?.id
            dispatch({type: 'SET_ART_FRAME_COLOR', color: event.target.value, id: artData.artId, roomId: selectedRoomId})
            navigate('/walls')
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
            onLoad={onImgLoad}
            alt={artData.artist}
            data-src={'https://storage.googleapis.com/artsnob-image-scrape/'+artData.images}
            className="large-image img"
            src={'https://storage.googleapis.com/artsnob-image-scrape/'+artData.images}
            />
        </div>
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
            <div className="prize-size-buttons">
            <FormControl variant="outlined" style={{width: '90%'}}>
                <InputLabel id="price-and-size-selection-label">Price/size:</InputLabel>
                <Select
                labelId="price-and-size-selection-label"
                id="price-and-size-outlined"
                value={currentSize ? currentSize : 'medium'}
                onChange={handleUpdateArtSize}
                label="Price and size"
                style={{fontSize: '0.7em'}}
                >
                    {artData.size_price_list.map(x => {
                    return <MenuItem key={'menu-select'+x.price} value={x.type.trim()}>{`$${x.price}  ${x.size}`}</MenuItem>
                    })}
            
                </Select>
            </FormControl>

            <FormControl variant="outlined" style={{width: '90%', marginTop: '15px'}}>
                <InputLabel id="frame-color-selection-label">Frame Color:</InputLabel>
                <Select
                labelId="frame-color-selection-label"
                id="frame-outlined"
                value={currentColor ? currentColor : '#222'}
                onChange={handleUpdateFrameColor}
                label="Frame color"
                style={{fontSize: '0.7em'}}
                >
                    {colorList.map(x => {
                    return <MenuItem key={'menu-select'+x.name} value={x.code}>{x.name}</MenuItem>
                    })}
            
                </Select>
            </FormControl>
            </div>
            <div className="detail-purchase-buttons">
            {inRoom() ? 
                <Button variant="contained" color="secondary" 
            style={{width: "150px"}}
            onClick={()=>{dispatch({'type': 'REMOVE_ART', 'artId': artData.artId})}}>
            Remove from wall
            </Button> 
            :
            <Button variant="contained" color="secondary" 
            style={{width: "150px"}}
            onClick={()=>{                

                const roomLength =  state?.rooms?.length ?? 0;
                const artLength =  (roomLength>0) ? state?.artBrowseSeed?.art?.length : 0;
                const focusArtId =  state?.artBrowseSeed?.focusArtId ?? 0;

                if (focusArtId > 0) {
                    dispatch({...artData, type: 'ADD_ART', roomId: state.artBrowseSeed.id, roomArtId: focusArtId})
                    dispatch({'type': 'ART_BROWSE_SEED', 'artBrowseSeed': null})
                    dispatch({'type': 'CLOSE_ALL_MENUS'})
                    navigate('/walls')
                }

                else {
                    let selectedRoomId = (state?.artBrowseSeed?.id) ? state?.artBrowseSeed?.id : state?.rooms[0]?.id
                    dispatch({'type': 'ADD_NEW_FRAME_AND_ART', ...artData, 
                    size: (replaceWithLandscape && selectedSize.slice(0,2) === 'p_') ? 'l_'+selectedSize.slice(2) : selectedSize, 
                    roomId: selectedRoomId});
                    dispatch({'type': 'ART_BROWSE_SEED', 'artBrowseSeed': null})
                    dispatch({'type': 'CLOSE_ALL_MENUS'})
                    navigate('/walls')
                }
                
                }}>
            Add to wall
            </Button> 
            }           
            <Button variant="contained" style={{width: "150px", marginTop: "15px"}}
            onClick={()=>{dispatch({'type': 'LIKE_ART', 'art': artData})}}>{saveCopy()}</Button>
            <Button variant="contained" style={{width: "150px", marginTop: "15px"}}
            onClick={() => {
                defaultAnalytics.logEvent('purchase', 
                              {value: Number(artData?.size_price_list[2]?.price)*0.1,
                              items: [{id: artData.id, 
                              name: artData.name, 
                              category: artData?.metadata?.cluster_id,
                              variant: artData?.size_price_list[2]?.size
                              }]
                              })
                openInNewTab(artData.page_url+'?curator=mskarlin')}}>Purchase work</Button>
            <Typography variant='caption' align='center'>(Affiliate link)</Typography>
            </div>
        </div>
        <ArtCarousel endpoints={endpoints}/>
    </div>
    </div>
)

}
