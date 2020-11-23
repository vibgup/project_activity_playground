import { configureStore } from '@reduxjs/toolkit';
import playgroundReducer from 'components/Playground/playgroundSlice';

export default configureStore({
  reducer: {
    playground: playgroundReducer,
  },
});
