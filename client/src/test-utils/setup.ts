import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// With globals: false, @testing-library/react's automatic afterEach(cleanup)
// registration (which relies on detecting a global `afterEach`) never fires,
// so multiple renders accumulate in the DOM across tests within the same
// file. Register cleanup explicitly so each test starts from an empty DOM.
afterEach(() => {
  cleanup();
});
