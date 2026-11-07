/* XU ThriftExchange — functional listing search and filters (Firebase compat API). */
(function (root) {
  'use strict';
  const STATUSES=['Available','Reserved','Sold'];
  function fold(s){return String(s??'').normalize('NFKC').toLocaleLowerCase('en').trim();}
  function filterListings(listings,{keyword='',category='All',course='',status='All'}={}) {
    const word=fold(keyword), type=fold(category), courseText=fold(course);
    return (Array.isArray(listings)?listings:[]).filter(item => {
      if (item.visibility && item.visibility!=='public') return false;
      if (type && type!=='all' && fold(item.category)!==type) return false;
      if (courseText && !fold(item.course).includes(courseText)) return false;
      if (status && status!=='All' && item.status!==status) return false;
      if (!word) return true;
      return [item.title,item.description,item.course,item.category].some(value=>fold(value).includes(word));
    });
  }
  async function searchListings({firestore,keyword='',category='All',course='',status='All',limit=100}={}) {
    if (!firestore || typeof firestore.collection !== 'function') throw new Error('Firestore is not configured.');
    if (status!=='All' && !STATUSES.includes(status)) throw new Error('Invalid availability filter.');
    const cap=Math.min(100,Math.max(1,Number(limit)||100));
    let q=firestore.collection('listings').where('visibility','==','public');
    // Avoid broad dynamic compound-index requirements in the initial milestone.
    // Keyword/category/course filters operate on a bounded first-page result set.
    const snapshot=await q.limit(cap).get();
    const listings=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
    return filterListings(listings,{keyword,category,course,status});
  }
  function displaySearchResults(listings,resultElement,renderItem) {
    if (!resultElement || typeof resultElement.replaceChildren!=='function') throw new Error('A results container is required.');
    resultElement.replaceChildren();
    if (!listings.length) {
      const empty=resultElement.ownerDocument.createElement('p');
      empty.className='muted';empty.textContent='No matching items. Try a different search or category.';
      resultElement.appendChild(empty);
    } else {
      if (typeof renderItem!=='function') throw new Error('A safe item-rendering callback is required.');
      for(const listing of listings){const el=renderItem(listing);if (!(el && el.nodeType===1)) throw new Error('renderItem must return an element.');resultElement.appendChild(el);}
    }
    return listings.length;
  }
  root.XUThriftFeatures = root.XUThriftFeatures || {};
  root.XUThriftFeatures.searchFilter={filterListings,searchListings,displaySearchResults};
})(typeof window !== 'undefined' ? window : globalThis);
