const WORKOUT_SEARCH_TERMS = {
  run:   'running workout hip hop energetic',
  hiit:  'hiit cardio workout electronic',
  lift:  'gym lifting workout motivational',
  cycle: 'cycling spin workout edm',
  yoga:  'yoga meditation relaxing',
  other: 'workout music motivational',
};

export async function getRecommendations(req, res) {
  const { workoutType, intensity, durationMinutes } = req.query;

  const term = WORKOUT_SEARCH_TERMS[workoutType] || WORKOUT_SEARCH_TERMS.other;
  const limit = Math.max(10, Math.min(25, Math.ceil((durationMinutes || 30) / 3.5)));

  const url = new URL('https://itunes.apple.com/search');
  url.searchParams.set('term', term);
  url.searchParams.set('entity', 'song');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('explicit', intensity >= 7 ? 'Yes' : 'No');

  const response = await fetch(url.toString());
  const data = await response.json();

  const tracks = data.results.map(t => ({
    id: t.trackId,
    title: t.trackName,
    artist: t.artistName,
    album: t.collectionName,
    artwork: t.artworkUrl100?.replace('100x100', '300x300'),
    previewUrl: t.previewUrl,
    appleMusicUrl: t.trackViewUrl,
    duration: Math.round(t.trackTimeMillis / 1000),
  }));

  res.json(tracks);
}
