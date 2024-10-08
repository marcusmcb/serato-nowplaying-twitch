// src/components/ReportViewer.js
import React, { Fragment } from 'react'
import { ReportData } from '../types'
import './styles/reportviewer.css'

interface ReportDataProps {
	reportData: ReportData | null
	setReportView: (value: boolean) => void
}

const ReportViewer: React.FC<ReportDataProps> = ({
	reportData,
	setReportView,
}): JSX.Element => {
	// if (!reportData) return <p>No report data available</p>;
	// console.log("Report Data: ", reportData);
	return (
		<Fragment>
      
			<div className='report-title'>
				npChatbot stats for <span className='report-dj-name'>{reportData?.dj_name}</span>
			</div>
			<div className='report-subtitle'>{reportData?.playlist_date}</div>
      <hr/>
			<div className='report-panel'>
				<div className='report-panel-left'>					
					<div className='report-panel-item'>
						Set Start Time:{' '}
						<span className='report-panel-item-span'>
							{reportData?.set_start_time}
						</span>
					</div>
					<div className='report-panel-item'>
						Set Length:{' '}
						<span className='report-panel-item-span'>
							{reportData?.set_length}
						</span>
					</div>
					<div className='report-panel-item'>
						Tracks Played:{' '}
						<span className='report-panel-item-span'>
							{reportData?.total_tracks_played}
						</span>
					</div>
					<div className='report-panel-item'>
						Average Track Length:{' '}
						<span className='report-panel-item-span'>
							{reportData?.average_track_length}
						</span>
					</div>
				</div>
				<div className='report-panel-right'>
					<div className='report-panel-item'>
						Longest Song Played:{' '}						
					</div>
          <div className='report-panel-item-detail'>
            {reportData?.longest_track_name}
          </div>
          <div className='report-panel-item-detail-caption'>
            ({reportData?.longest_track_length})
          </div>
					<div className='report-panel-item'>
						Shortest Song Played:{' '}						
					</div>
          <div className='report-panel-item-detail'>
            {reportData?.shortest_track_name}
          </div>
          <div className='report-panel-item-detail-caption'>
            ({reportData?.shortest_track_length})
          </div>
				</div>
			</div>
			<button
				className='report-close-button'
				onClick={() => {
					console.log(reportData)
					setReportView(false)
				}}
			>
				Close
			</button>
		</Fragment>
	)
}

export default ReportViewer
