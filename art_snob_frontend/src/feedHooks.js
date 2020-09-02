import { useEffect, useCallback, useRef } from 'react';

export const useFetch = (loadMore, dispatch, setLoadMore) => {
    useEffect(() => {
        dispatch({ type: 'FETCHING_IMAGES', fetching: true })
        fetch('/feed/')
        .then(data => data.json())
        .then(images => {
            dispatch({ type: 'STACK_IMAGES', images })
            dispatch({ type: 'FETCHING_IMAGES', fetching: false })
            setLoadMore(false)
        })
        .catch(e => {
            // handle error
            dispatch({ type: 'FETCHING_IMAGES', fetching: false })
            setLoadMore(false)
            return e
        })
    }, [dispatch, loadMore, setLoadMore])
}

export const useInfiniteScroll = (scrollRef, dispatch) => {
// we use a callback here so that it's not constantly re-creating
// callbacks are basically memoized func calls, so when 
// we make this a dependency of an effect, it won't need to rerun 
const scrollObserver = useCallback(
    node => {
      new IntersectionObserver(entries => {
        entries.forEach(en => {
          if ((en.intersectionRatio > 0) || (en.isIntersecting)) {
            dispatch(true);
          }
        });
      }).observe(node);
    },
    [dispatch]
  );

  useEffect(() => {

    if (scrollRef.current) {
      scrollObserver(scrollRef.current);
    }
  }, [scrollObserver, scrollRef]);
}

export const useLazyLoading = (imgSelector, items) => {
    const imgObserver = useCallback(node => {
    const intObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.intersectionRatio > 0) {
          const currentImg = en.target;
          const newImgSrc = currentImg.dataset.src;
          // only swap out the image source if the new url exists
          if (!newImgSrc) {
            console.error('Image source is invalid');
          } else {
            currentImg.src = newImgSrc;
          }
          intObs.unobserve(node); // detach the observer when done
        }
      });
    })
    intObs.observe(node);
    }, []);
    const imagesRef = useRef(null);
    useEffect(() => {
      imagesRef.current = document.querySelectorAll(imgSelector);
      if (imagesRef.current) {
        imagesRef.current.forEach(img => imgObserver(img));
      }
    }, [imgObserver, imagesRef, imgSelector, items])
  }
