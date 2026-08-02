export function attachImageSkeleton(image, {
  container = image?.parentElement
} = {}) {
  if (!image || !container) return;

  container.classList.add('has-skeleton');

  const clear = () => {
    container.classList.remove('has-skeleton');
    container.classList.add('image-ready');
  };

  if (image.complete && image.naturalWidth > 0) {
    clear();
    return;
  }

  image.addEventListener('load', clear, { once: true });
  image.addEventListener('error', clear, { once: true });
}

export function scanImageSkeletons(root = document) {
  root.querySelectorAll(
    '.choice-image-wrap img, .swipe-card-image img, .favorite-card-image img, .timeline-card-image img, .journal-image-wrap img, .rediscover-image-wrap img, .prediction-image-wrap img'
  ).forEach(image => attachImageSkeleton(image));
}
