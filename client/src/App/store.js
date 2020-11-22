import { configureStore } from '@reduxjs/toolkit';
import playgroundReducer from 'containers/Playground/playgroundSlice';

export default configureStore({
  reducer: {
    playground: playgroundReducer,
  },
});
