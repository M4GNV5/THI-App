import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import styles from '../styles/Timetable.module.css'

import { obtainSession, getExams } from '../lib/thi-api-client'
import { formatFriendlyDateTime } from '../lib/date-utils'

export default function Exams () {
  const router = useRouter()
  const [exams, setExams] = useState(null)
  const [focusedExam, setFocusedExam] = useState(null)

  useEffect(async () => {
    const session = await obtainSession(router)
    const examList = await getExams(session)
    const now = new Date()

    setExams(examList
      .map(x => {
        if(x.exm_date && x.exam_time)
          x.date = new Date(x.exm_date + 'T' + x.exam_time)
        else
          x.date = null

        x.anmeldung = new Date(x.anm_date + 'T' + x.anm_time)
        x.allowed_helpers = JSON.parse('[' + x.hilfsmittel.slice(1, -1) + ']')
          .filter((v, i, a) => a.indexOf(v) === i)

        return x
      })
      .filter(x => x.date === null || x.date > now)
    )
  }, [])

  return (
    <Container>
      <Modal show={!!focusedExam} onHide={() => setFocusedExam(null)}>
        <Modal.Header closeButton>
          <Modal.Title>{focusedExam && focusedExam.titel}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <strong>Art</strong>: {focusedExam && focusedExam.pruefungs_art}<br />
          <strong>Raum</strong>: {focusedExam && (focusedExam.exam_rooms || 'TBD')}<br />
          <strong>Sitzplatz</strong>: {focusedExam && (focusedExam.exam_seat || 'TBD')}<br />
          <strong>Termin</strong>: {focusedExam && (focusedExam.date ? formatFriendlyDateTime(focusedExam.date) : 'TBD')}<br />
          <strong>Anmerkung</strong>: {focusedExam && focusedExam.anmerkung}<br />
          <strong>Prüfer</strong>: {focusedExam && focusedExam.pruefer_namen}<br />
          <strong>Studiengang</strong>: {focusedExam && focusedExam.stg}<br />
          <strong>Angemeldet</strong>: {focusedExam && formatFriendlyDateTime(focusedExam.anmeldung)}<br />
          <strong>Hilfsmittel</strong>: {focusedExam && focusedExam.allowed_helpers.map((helper, i) =>
            <div key={i}>{helper}</div>)}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setFocusedExam(null)}>
            Schließen
          </Button>
        </Modal.Footer>
      </Modal>

      <ListGroup>
          <h4 className={styles.dateBoundary}>
            Prüfungen
          </h4>

          {exams && exams.map((item, idx) =>
          <ListGroup.Item key={idx} className={styles.item} action onClick={() => setFocusedExam(item)}>
              <div className={styles.left}>
                <div className={styles.name}>
                    <strong>{item.titel}</strong><br />
                    {item.stg}, {item.pruefer_namen}
                </div>
                <div className={styles.room}>
                    Raum: {item.exam_rooms || 'TBD'} {item.exam_seat || ''}
                </div>
              </div>
              <div className={styles.right}>
              {item.date ? formatFriendlyDateTime(item.date) : 'Termin: TBD'}
              </div>
          </ListGroup.Item>
          )}
      </ListGroup>
    </Container>
  )
}