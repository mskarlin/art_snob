import React, {useState, useContext} from 'react';
import { store } from './store.js';
import _ from 'lodash';
import {useDraggable} from '@dnd-kit/core';


export function Draggable(props) {

  const Element = props.element || 'div';
  const globalState = useContext(store);
  const { state, dispatch } = globalState;

  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: props.id,
  });

  const [prevX, setPrevX] = useState(0)
  const [prevY, setPrevY] = useState(0)
  const [originX, setOriginX] = useState(props.x | 0)
  const [originY, setOriginY] = useState(props.y | 0)

  if (transform) {

    if (prevX !== transform.x || prevY !== transform.y){
      setPrevX(transform.x)
      setPrevY(transform.y)
    }
  

 } else {
     // prevX,Y will be relative to the initial origin x,y
     // we need to move the origin to account for this
    if ((originX+prevX) !== originX || (originY+prevY) !== originY) {
        setOriginX(originX+prevX)
        setOriginY(originY+prevY)
        setPrevX(0)
        setPrevY(0)
        dispatch({type: 'SET_ART_XY', 
        x: originX+prevX, 
        y: originY+prevY, 
        roomId: props.roomId, 
        roomArtId: props.roomArtId})
    }
 }
    
  const style = (transform) ? {transform: `translate3d(${(originX+transform.x)*(props.scaleX || 1.0)}px, 
    ${(originY+transform.y)*(props.scaleY||1.0)}px, 0)`} :
  {transform: `translate3d(${originX*(props.scaleX||1.0)}px, ${originY*(props.scaleY||1.0)}px, 0)`};

  return (
    <Element ref={setNodeRef} {...listeners} {...attributes} style={style}>
      {props.children}
    </Element>
  );
}

// return the transform object with zoom scaling
export function scaleByZoom(zoom) {
  
  return function scaledTranslate (args) {
    const {transform} = args

    return {
      ...transform,
      x: transform.x,
      y: transform.y,
    }
  }

 }