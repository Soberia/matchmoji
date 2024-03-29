import {memo, useRef, useEffect} from 'react';

import CSS from './Changelog.module.css';
import CSSSetting from '../Setting.module.css';
import CSSCommon from '../../../Common.module.css';
import Focus from '../../../elements/focus/Focus';
import Vector from '../../../elements/vector/Vector';
import CloseButton from '../../../elements/close-button/CloseButton';
import {KeyHandlerCallbacks} from '../../Modal';
import {fetchFile} from '../../../../utility/request';
import {ROUTES, History} from '../../../../utility/history';

export type ChangelogData =
  | {[key: string]: string[]} /* loaded */
  | null /* failed */
  | undefined /* loading */;

export default memo(
  function Changelog({
    keyHandlerCallbacks,
    data,
    history,
    setData,
    setHistory
  }: {
    keyHandlerCallbacks: KeyHandlerCallbacks;
    data: ChangelogData;
    history: History;
    setData: SetState<ChangelogData>;
    setHistory: SetState<History>;
  }) {
    const self = useRef<HTMLDivElement>(null);

    useEffect(() => {
      // Attaching key handler callbacks
      keyHandlerCallbacks.onEnter = undefined;
      keyHandlerCallbacks.onEscape = exitHandler;

      // Attaching custom navigation history handler
      // for being able to play the exit animation.
      history.navigationHandler = exitHandler;
    });

    useEffect(() => {
      // Getting changelog data from the web server
      if (data === undefined)
        (async () => {
          try {
            setData(
              await fetchFile(`${ROUTES.publicUrl}/changelog.json`, 'json')
            );
          } catch {
            setData(null);
          }
        })();
    }, [data, setData]);

    /** Handles unmounting the component. */
    function exitHandler() {
      self.current!.classList.add(CSS.Exit);
      window.setTimeout(() => {
        // Waiting for the animation
        if (self.current)
          setHistory(state => ({...state, hash: ROUTES.setting}));
      }, 500);
    }

    let result: JSX.Element | JSX.Element[];
    if (data === undefined)
      result = <Vector name="loading" className={CSS.Icons} />;
    else if (data === null)
      result = (
        <Focus>
          <Vector
            name="refresh"
            title="Reload"
            className={[CSS.Icons, CSS.Reload].join(' ')}
            onClick={() => setData(undefined)}
          />
        </Focus>
      );
    else {
      // Parsing changelog data
      result = [];
      const tag = /^\[.*\]/i;
      for (const [version, changes] of Object.entries(data))
        result.push(
          <dl key={version} className={CSSCommon.Code}>
            <dt>{version}</dt>
            {changes.map((change, idx) => (
              <dd key={idx}>
                &bull; <span className={CSS.Tag}>{change.match(tag)?.[0]}</span>
                {change.replace(tag, '')}
              </dd>
            ))}
          </dl>
        );
    }

    return (
      <div
        ref={self}
        className={[
          CSS.Changelog,
          CSSSetting.Content,
          CSSCommon.Scrollbar
        ].join(' ')}>
        <CloseButton className={CSS.CloseButton} callback={exitHandler} />
        {result}
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.data === nextProps.data
);
