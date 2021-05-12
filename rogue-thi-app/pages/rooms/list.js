import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

import ReactPlaceholder from 'react-placeholder'
import ListGroup from 'react-bootstrap/ListGroup'
import Dropdown from 'react-bootstrap/Dropdown'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import AppBody from '../../components/AppBody'
import AppNavbar from '../../components/AppNavbar'
import AppTabbar from '../../components/AppTabbar'
import { callWithSession, NoSessionError } from '../../lib/thi-backend/thi-session-handler'
import { getFreeRooms } from '../../lib/thi-backend/thi-api-client'
import { formatNearDate, formatFriendlyTime } from '../../lib/date-utils'

import styles from '../../styles/RoomsList.module.css'

const TUX_ROOMS = ['G308']

export default function RoomList () {
  const router = useRouter()
  const [freeRooms, setFreeRooms] = useState(null)

  useEffect(async () => {
    try {
      const now = new Date()
      const data = await callWithSession(
        session => getFreeRooms(session, now)
      )

      const days = data.rooms.map(day => {
        const result = {}
        result.date = new Date(day.datum)
        result.hours = {}

        day.rtypes.forEach(roomType => Object.entries(roomType.stunden).forEach(([hIndex, hour]) => {
          const to = new Date(day.datum + 'T' + hour.bis)
          if (to < now) { return }

          if (!result.hours[hIndex]) {
            result.hours[hIndex] = {
              from: new Date(day.datum + 'T' + hour.von),
              to: new Date(day.datum + 'T' + hour.bis),
              roomTypes: {}
            }
          }

          result.hours[hIndex].roomTypes[roomType.raumtyp] = hour.raeume.split(', ')
        }))

        return result
      })
        .filter(day => Object.entries(day.hours) !== 0)

      setFreeRooms(days)
    } catch (e) {
      if (e instanceof NoSessionError) {
        router.replace('/login')
      } else {
        console.error(e)
        alert(e)
      }
    }
  }, [])

  return (
    <>
      <AppNavbar title="Stündlicher Raumplan">
        <Dropdown.Item variant="link" href="/rooms">
          Kartenansicht
        </Dropdown.Item>
        <Dropdown.Item variant="link" href="/rooms/search">
          Erweiterte Suche
        </Dropdown.Item>
      </AppNavbar>

      <AppBody>
        <ReactPlaceholder type="text" rows={20} ready={freeRooms}>
          {freeRooms && freeRooms.map((day, i) =>
            Object.values(day.hours).map((hour, j) =>
              <ListGroup key={i + '-' + j}>
                <h4 className={styles.dateBoundary}>
                  {formatNearDate(day.date)}, {formatFriendlyTime(hour.from)} - {formatFriendlyTime(hour.to)}
                </h4>

                {Object.entries(hour.roomTypes).map(([roomName, rooms], idx) =>
                  <ListGroup.Item key={idx} className={styles.item}>
                    <div className={styles.left}>
                      <div className={styles.name}>
                        {roomName}
                      </div>
                      <div className={styles.room}>
                        {rooms.map((room, idx) =>
                          <>
                            <Link href={`/rooms?highlight=${room}`}>
                              {room}
                            </Link>
                            {TUX_ROOMS.includes(room) && <> <FontAwesomeIcon icon={faLinux} /></>}
                            {idx === rooms.length - 1 ? '' : ', '}
                          </>
                        )}
                      </div>
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            )
          )}
        </ReactPlaceholder>
      </AppBody>

      <AppTabbar />
    </>
  )
}
